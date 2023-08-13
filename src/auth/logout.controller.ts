import { Request, Response } from 'express';
import { DirectusCollections, getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';

export async function logoutController(req: Request, res: Response) {
  const payload: { refresh_token: string } = req.body;
  if(!payload || !payload.refresh_token) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error('Payload is missing refresh_token.');
    return res.status(400).send({
      type: 'payload',
      message: 'Payload is missing refresh_token.',
    })
  }
  try {
    const directus = new Directus<DirectusCollections>(process.env.DIRECTUS_URL || 'http://localhost:8055', {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN || ''
      }
    });
    const wantedSessions = await directus.items('cc_sessions').readByQuery({
      fields: ['id'],
      filter: {
        refresh_token: {
          _eq: payload.refresh_token
        }
      }
    });
    if(wantedSessions.data != null && wantedSessions.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
      console.error('Session not found.');
      return res.status(401).send({
        type: 'unauthorized',
        message: 'Invalid refresh token.',
      });
    }
    await directus.items('cc_sessions').deleteMany(wantedSessions.data!.map(session => session.id));
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      type: 'success',
      message: 'Session deleted.',
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