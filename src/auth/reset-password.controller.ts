import { Request, Response } from 'express';
import { DirectusCollections, getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';
import fetch from 'node-fetch';

export function generateString(length: number) {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		);
	}
	return result;
}

export async function sendMail(data: {
  to: string,
  subject: string,
  template: {
    name: string,
    data: {
      [key: string]: any
    }
  }
}) {
  try {
    const payload = {
      ...data,
      token: process.env.MAIL_TOKEN || ''
    };

    const result = await fetch(`${process.env.DIRECTUS_URL}/mail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if(result.status !== 200) {
      console.log(result);
      throw new Error(`Mail service responded with status: ${result.status}`);
    }
  } catch (error) { 
    throw error;
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  const payload: {
    email: string,
  } = req.body;
  if(!payload || !payload.email) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error('Field "email" is required.');
    return res.status(400).send({
      type: 'payload',
      message: 'Field "email" is required.',
    });
  }

  try {
    const directus = new Directus<DirectusCollections>(process.env.DIRECTUS_URL || 'http://localhost:8055', {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN || ''
      }
    });
    const wantedUsers = await directus.items('cc_users').readByQuery({
      fields: ['*'],
      filter: {
        email: {
          _eq: payload.email
        }
      }
    });
    if(!wantedUsers.data || wantedUsers.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      console.error(`User with email: ${payload.email} not found`);
      return res.status(404).send({
        type: 'not_found',
        message: 'User not found',
      });
    }
    const wantedUser = wantedUsers.data[0];
    if(!wantedUser.active) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 403 Unauthorized`);
      console.error(`User with email: ${payload.email} is not active`);
      return res.status(403).send({
        type: 'inactive',
        message: 'User is not active',
      });
    }
    if(wantedUser.last_password_change != null && new Date(wantedUser.last_password_change).getTime() > new Date().getTime() - 86400000) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 403 Unauthorized`);
      console.error(`User with email: ${payload.email} changed password less than 24 hours ago`);
      return res.status(403).send({
        type: 'changed_recently',
        message: 'Password changed less than 24 hours ago',
      });
    }
    const activeRequests = await directus.items('cc_password_resets').readByQuery({
      fields: ['*'],
      filter: {
        _and: [
          {
            account: {
              _eq: wantedUser.id
            }
          },
          {
            used: {
              _eq: false
            }
          },
          {
            expires: {
              _gt: new Date().getTime()
            }
          }
        ]
      }
    });
    if(activeRequests.data != null && activeRequests.data.length > 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 403 Unauthorized`);
      console.error(`User with email: ${payload.email} has active password reset request`);
      return res.status(403).send({
        type: 'active_request',
        message: 'User has active password reset request',
      });
    }
    const token = generateString(32);
    const expires = new Date().getTime() + 3600000;
    
    await sendMail({
      to: wantedUser.email,
      subject: 'Resetowanie hasła w serwisie CarCase',
      template: {
        name: 'reset-password',
        data: {
          token,
          expires
        }
      }
    });

    await directus.items('cc_password_resets').createOne({
      reset_token: token,
      account: wantedUser.id,
      expires
    });
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      type: 'success',
      message: 'Password reset request created.',
    });
  } catch (error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`);
    console.error(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error.',
    });
  }
}