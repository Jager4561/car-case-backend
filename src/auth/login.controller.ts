import { Request, Response } from 'express';
import { validateLoginPayload } from './auth.service';
import { DirectusCollections, getCurrentTime } from '../helpers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Directus } from '@directus/sdk';

export async function loginController(req: Request, res: Response) {
  const payload: {
    email: string,
    password: string
  } = req.body;
  const payloadValidation = validateLoginPayload(payload);
  if(payloadValidation) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error(payloadValidation);
    return res.status(400).send({
      type: 'payload',
      message: payloadValidation
    });
  }
  const { email, password } = payload;
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
          _eq: email
        }
      }
    });
    if(wantedUsers.data != null && wantedUsers.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      console.error(`User with email: ${email} not found`);
      return res.status(401).send({
        type: 'not_found',
        message: 'User not found'
      });
    }
    const wantedUser = wantedUsers.data![0];
    if(!wantedUser.active) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
      console.error(`User with email: ${email} is not active`);
      return res.status(401).send({
        type: 'inactive',
        message: 'User is not active'
      });
    }
    const passwordMatch = await directus.utils.hash.verify(password, wantedUser.password);
    if(!passwordMatch) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
      console.error(`User with email: ${email} provided invalid password`);
      return res.status(401).send({
        type: 'invalid_password',
        message: 'Invalid password'
      });
    }
    const accessToken: string = jwt.sign(
      { user_id: wantedUser.id, email },
      process.env.ACCESS_TOKEN_KEY!,
      {
        expiresIn: process.env.ACCESS_TOKEN_TTL,
      }
    );
    const accessExpiration = ((jwt.decode(accessToken) as JwtPayload).exp as number) * 1000;
    const refreshToken = jwt.sign(
      { user_id: wantedUser.id, email },
      process.env.REFRESH_TOKEN_KEY!,
      {
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      }
    );
    const refreshExpiration = ((jwt.decode(refreshToken) as JwtPayload).exp as number) * 1000;
    await directus.items('cc_sessions').createOne({
      access_token: accessToken,
      expires: accessExpiration,
      refresh_token: refreshToken,
      refresh_expiration: refreshExpiration,
      account: wantedUser.id
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
      type: 'internal_server_error',
      message: 'Internal server error'
    });
  }
}