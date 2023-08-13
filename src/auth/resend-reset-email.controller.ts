import { Request, Response } from 'express';
import { DirectusCollections, getCurrentTime } from '../helpers';
import { sendMail } from './reset-password.controller';
import { Directus } from '@directus/sdk';

export async function resendResetEmailController(req: Request, res: Response) {
  const payload: {
    email: string;
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
    const wantedRequests = await directus.items('cc_password_resets').readByQuery({
      fields: ['*', 'account.email'],
      filter: {
        _and: [
          {
            account: {
              email: payload.email
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
    if(wantedRequests.data == null || wantedRequests.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      console.error(`User with email: ${payload.email} already has an active reset request`);
      return res.status(404).send({
        type: 'not_found',
        message: 'Password reset request already exists',
      });
    }
    const wantedRequest = wantedRequests.data[0];
    await directus.items('cc_password_resets').updateOne(wantedRequest.id, {
      used: true,
    });
    await sendMail({
      to: wantedRequest.account.email,
      subject: 'Resetowanie hasła w serwisie CarCase',
      template: {
        name: 'reset-password',
        data: {
          token: wantedRequest.reset_token,
          expires: wantedRequest.expires,
        }
      }
    });
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      type: 'success',
      message: 'Password reset request mail resent.',
    });
  } catch(error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`);
    console.error(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error.',
    });
  }
}