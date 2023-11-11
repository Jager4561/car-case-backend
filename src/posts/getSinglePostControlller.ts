import { Request, Response } from 'express';
import { getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';
import { countLikesAndDislikes, parsePost } from './posts.service';

export async function getSinglePostController(req: Request, res: Response) {
	const id = req.params.id;

	if (!id) {
		console.error(
			`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
		);
		return res.status(400).json({
			type: 'bad_request',
			message: 'Missing id parameter',
		});
	}

	try {
		const directus = new Directus(
			process.env.DIRECTUS_URL || 'http://localhost:8055',
			{
				auth: {
					staticToken: process.env.DIRECTUS_TOKEN || '',
				},
			}
		);
		const session = res.locals.session;
		let wantedPost: any = null;
		try {
			wantedPost = await directus.items('cc_posts').readOne(id, {
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
			});
		} catch (error) {
			console.error(
				`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
			);
			return res.status(404).json({
				type: 'not_found',
				message: 'Post not found',
			});
		}
		if (
			wantedPost == null ||
			wantedPost.model_generation == null ||
			wantedPost.model_engine == null ||
			wantedPost.model_hull_type == null
		) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
			);
			return res.status(404).json({
				type: 'not_found',
				message: 'Post not found',
			});
		}

		if (wantedPost.status === 'draft' && session == null) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
			);
			return res.status(404).json({
				type: 'not_found',
				message: 'Post not found',
			});
		}

		if (
			session &&
      wantedPost.author &&
			session.accountId === wantedPost.author.id &&
			session.expired &&
			wantedPost.status === 'draft'
		) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${
					req.url
				} 401 Unauthorized`
			);
			return res.status(401).json({
				type: 'unauthorized',
				message: 'Unauthorized',
			});
		}
    const parsedPost = parsePost(wantedPost, session);
		console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
		return res.status(200).json(parsedPost);
	} catch (error) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 500 Bad Request`
		);
		console.error(error);
		return res.status(400).send({
			type: 'internal_server_error',
			message: 'Internal server error',
		});
	}
}
