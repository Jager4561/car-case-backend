import { Request, Response } from 'express';
import { AddPostPayload } from './posts.model';
import { parsePost, verifyAddPostPayload } from './posts.service';
import { getCurrentTime, getDirectus } from '../helpers';
import fs from 'fs';
import fsPromises from 'fs/promises';
import FormData from 'form-data';

export async function editPostController(req: Request, res: Response) {
	const id = req.params.id;
	const payload: AddPostPayload = {
		...req.body,
		sections: JSON.parse(req.body.sections),
	};
	const files = req.files as Express.Multer.File[];
	const session = res.locals.session;
	const tempPath = process.env.TEMP_PATH || 'temp/';

	const payloadValidation = verifyAddPostPayload(payload);
	if (payloadValidation != null) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
		);
		return res.status(400).send({
			type: 'bad_request',
			message: payloadValidation,
		});
	}
	const filesCount = payload.sections.filter(
		(section) => section.type === 'image' && section.file != null
	).length;
	if (filesCount > 0 && (!files || filesCount != files.length)) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
		);
		return res.status(400).send({
			type: 'bad_request',
			message: 'Files are missing',
		});
	}
	const acceptableMimeTypes = [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
	];
	if (files) {
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!acceptableMimeTypes.includes(file.mimetype)) {
				console.log(
					`[${getCurrentTime()}] ${req.method} ${
						req.url
					} 400 Bad Request`
				);
				return res.status(400).send({
					type: 'invalid_file_type',
					message: 'File is not an image',
				});
			}
		}
	}

	try {
		const directus = getDirectus();
		const wantedPost = await directus.items('cc_posts').readOne(id, {
			fields: ['*'],
		});
		if (wantedPost == null) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
			);
			return res.status(404).send({
				type: 'not_found',
				message: 'Post not found',
			});
		}
		if (session == null || session.accountId !== wantedPost.author) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`
			);
			return res.status(401).send({
				type: 'Forbidden',
				message: 'Forbidden',
			});
		}
		let wantedGeneration = await directus
			.items('cc_generations')
			.readOne(payload.generation, {
				fields: [
					'*',
					'engines.cc_engines_id.id',
					'hull_types.cc_hull_types_id.id',
				],
			});
		if (!wantedGeneration) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
			);
			return res.status(400).send({
				type: 'generation_not_found',
				message: 'Generation not found',
			});
		}
		wantedGeneration = {
			...wantedGeneration,
			engines: wantedGeneration.engines.map(
				(engine: any) => engine.cc_engines_id.id
			),
			hull_types: wantedGeneration.hull_types.map(
				(hullType: any) => hullType.cc_hull_types_id.id
			),
		};
		if (!wantedGeneration.engines.includes(+payload.engine)) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
			);
			return res.status(400).send({
				type: 'invalid_engine',
				message: 'Invalid engine',
			});
		}
		if (!wantedGeneration.hull_types.includes(+payload.hull_type)) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
			);
			return res.status(400).send({
				type: 'invalid_hull_type',
				message: 'Invalid hull type',
			});
		}

		const filesToDelete = wantedPost.content
			.filter(
				(section: any) =>
					section.type === 'image' &&
					!payload.sections.find(
						(s: any) =>
							s.type === 'image' &&
							s.content === section.content &&
							s.file === null
					)
			)
			.map((section: any) => section.content);
		let uploadedFiles: string[] = [];
		if (files) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				let extension = file.mimetype.split('/')[1];
				if (extension === 'jpeg') extension = 'jpg';
				const filename = `${file.filename}.${extension}`;
				await fsPromises.rename(file.path, `${tempPath}${filename}`);
				const payload = new FormData();
				payload.append(
					'file',
					fs.createReadStream(tempPath + filename)
				);
				const uploadedFile = await directus.files.createOne(
					payload,
					{},
					{
						requestOptions: {
							headers: payload.getHeaders(),
						},
					}
				);
				fs.unlinkSync(tempPath + filename);
				if (!uploadedFile) {
					console.log(
						`[${getCurrentTime()}] ${req.method} ${
							req.url
						} 500 Bad Request`
					);
					return res.status(500).send({
						type: 'internal_server_error',
						message: 'Internal server error',
					});
				}
				uploadedFiles.push(uploadedFile.id);
			}
		}

		const updatedPost = await directus.items('cc_posts').updateOne(
			id,
			{
				status: payload.status,
				date_updated: new Date().toISOString(),
				title: payload.title,
				abstract: payload.abstract,
				model_generation: +payload.generation,
				model_engine: +payload.engine,
				model_hull_type: +payload.hull_type,
				content: payload.sections
					.map((section) => {
						switch (section.type) {
							case 'text': {
								return {
									type: 'text',
									size: section.size,
									content: section.content,
								};
							}
							case 'image': {
								return {
									type: 'image',
									content:
										section.file !== null
											? uploadedFiles[section.file]
											: section.content,
								};
							}
							default: {
								return null;
							}
						}
					})
					.filter((section) => section != null),
			},
			{
				fields: [
					'*',
					'brand.*',
					'vehicle.*',
					'model.*',
					'model_generation.id',
					'model_generation.name',
					'model_generation.image',
					'model_generation.model.*',
					'model_generation.model.brand.*',
					'model_engine.id',
					'model_engine.name',
					'model_engine.capacity',
					'model_engine.horse_power',
					'model_engine.fuel.*',
					'model_hull_type.*',
					'author.id',
					'author.avatar',
					'author.name',
					'comments.*',
					'comments.author.id',
					'comments.author.avatar',
					'comments.author.name',
					'comments.ratings.*',
					'ratings.*',
					'ratings.account',
				],
			}
		);
		await directus.files.deleteMany(filesToDelete);
		const parsedPost = parsePost(updatedPost, session);
		console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
		return res.status(200).send(parsedPost);
	} catch (error) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${
				req.url
			} 500 Internal Server Error`
		);
		console.error(error);
		return res.status(500).send({
			type: 'internal_server_error',
			message: 'Internal server error',
		});
	}
}
