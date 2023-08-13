import { Request, Response } from 'express';
import { getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';
import { CCSessionExtended } from './auth.model';
import jwt, { JwtPayload } from 'jsonwebtoken';

export async function refreshController(req: Request, res: Response) {
  const payload: { refresh_token: string } = req.body;
  if(!payload || !payload.refresh_token) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error('Refresh token is required.');
    return res.status(400).send({
      type: 'payload',
      message: 'Refresh token is required.',
    });
  }
  const directus = new Directus(process.env.DIRECTUS_URL!, {
    auth: {
      staticToken: process.env.DIRECTUS_TOKEN!
    }
  });
  try {
    const wantedSessions = await directus.items('cc_sessions').readByQuery({
      fields: ['*', 'account.*'],
    });
    if(wantedSessions.data != null && wantedSessions.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
      console.error('Session not found.');
      return res.status(401).send({
        type: 'unaathorized',
        message: 'Invalid refresh token.',
      });
    }
    const session = wantedSessions.data![0] as CCSessionExtended;
    if(session.refresh_expiration < new Date().getTime()) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
      console.error('Refresh token expired.');
      return res.status(401).send({
        type: 'unaathorized',
        message: 'Invalid refresh token.',
      });
    }
    const accessToken: string = jwt.sign(
      { user_id: session.account.id, email: session.account.email },
      process.env.ACCESS_TOKEN_KEY!,
      {
        expiresIn: process.env.ACCESS_TOKEN_TTL,
      }
    );
    const accessExpiration = ((jwt.decode(accessToken) as JwtPayload).exp as number) * 1000;
    const refreshToken: string = jwt.sign(
      { user_id: session.account.id, email: session.account.email },
      process.env.REFRESH_TOKEN_KEY!,
      {
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      }
    );
    const refreshExpiration = ((jwt.decode(refreshToken) as JwtPayload).exp as number) * 1000;
    await directus.items('cc_sessions').updateOne(session.id, {
      access_token: accessToken,
      expires: accessExpiration,
      refresh_token: refreshToken,
      refresh_expiration: refreshExpiration,
    });
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      access_token: accessToken,
      expires: accessExpiration,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`);
    console.error(error);
    return res.status(500).send({
      type: 'error',
      message: 'Internal Server Error.',
    });
  }
}