import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';
import { validatePassword } from '../register/register.service';

export async function changePasswordController(req: Request, res: Response) {
	const session = res.locals.session;
	const oldPassword = req.body.current_password;
	const newPassword = req.body.new_password;

	if (!oldPassword) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
		);
		return res.status(400).send({
			type: 'field_missing',
			message: 'No current password provided',
		});
	}

	if (!newPassword) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
		);
		return res.status(400).send({
			type: 'field_missing',
			message: 'No new password provided',
		});
	}

	const validation = validatePassword(newPassword);
	if (validation !== null) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
		);
		return res.status(400).send({
			type: 'requirements_not_met',
			message: validation,
		});
	}

	try {
		const directus = getDirectus();
		const account = await directus
			.items('cc_users')
			.readOne(session.accountId, {
				fields: ['id', 'password'],
			});
		if (!account) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
			);
			return res.status(404).send({
				type: 'not_found',
				message: 'Account not found',
			});
		}
		const isCorrectPassword = await directus.utils.hash.verify(
			oldPassword,
			account.password
		);
		if (!isCorrectPassword) {
			console.log(
				`[${getCurrentTime()}] ${req.method} ${
					req.url
				} 403 Forbidden`
			);
			return res.status(403).send({
				type: 'invalid_password',
				message: 'Invalid password',
			});
		}
		const hashedPassword = await directus.utils.hash.generate(newPassword);
		const updatedUser = await directus.items('cc_users').updateOne(
			session.accountId,
			{
				password: hashedPassword,
				last_password_change: new Date().toISOString(),
			},
			{
				fields: [
					'id',
          'email',
					'name',
					'avatar',
					'date_created',
					'last_password_change',
				],
			}
		);
		console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
		return res.status(200).send(updatedUser);
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
