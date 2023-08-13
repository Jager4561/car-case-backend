import { Request, Response } from 'express';
import { DirectusCollections, getCurrentTime } from '../helpers';
import { validatePassword } from '../register/register.service';
import { Directus } from '@directus/sdk';

export async function changePasswordController(req: Request, res: Response) {
  const payload: {
    token: string,
    password: string,
  } = req.body;
  if(!payload || !payload.token || !payload.password) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error('Fields "token" and "password" are required.');
    return res.status(400).send({
      type: 'payload',
      message: 'Fields "token" and "password" are required.',
    });
  }

  const validationResult = validatePassword(payload.password);
  if(validationResult) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error(validationResult);
    return res.status(400).send({
      type: 'payload',
      message: validationResult,
    });
  }

  try {
    const directus = new Directus<DirectusCollections>(process.env.DIRECTUS_URL || 'http://localhost:8055', {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN || ''
      }
    });
    const wantedRequests = await directus.items('cc_password_resets').readByQuery({
      fields: ['*', 'account.email', 'account.id'],
      filter: {
        reset_token: {
          _eq: payload.token
        }
      }
    });
    if(!wantedRequests.data || wantedRequests.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      console.error(`Password reset request with token: ${payload.token} not found`);
      return res.status(404).send({
        type: 'not_found',
        message: 'Password reset request not found',
      });
    }
    const wantedRequest = wantedRequests.data[0];
    if(wantedRequest.expires < new Date().getTime()) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 403 Unauthorized`);
      console.error(`Password reset request with token: ${payload.token} has expired`);
      return res.status(403).send({
        type: 'expired',
        message: 'Password reset request has expired',
      });
    }
    const password = await directus.utils.hash.generate(payload.password);
    await directus.items('cc_password_resets').updateOne(wantedRequest.id, {
      used: true,
    });
    await directus.items('cc_users').updateOne(wantedRequest.account.id, {
      password: password,
      last_password_change: new Date().toISOString(),
    });
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      type: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`);
    console.error(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error',
    });
  }
}