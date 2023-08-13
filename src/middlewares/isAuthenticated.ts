import { Request, Response, NextFunction } from "express";
import { DirectusCollections, getCurrentTime } from "../helpers";
import { Directus } from "@directus/sdk";

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;
  if (!authorization) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
    console.error('No authorization header found');
    return res.status(401).send({
      type: 'unaathorized',
      message: 'Unauthorized'
    });
  }
  const [authType, token] = authorization.split(' ');
  if (authType !== 'Bearer') {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
    console.error('Invalid authorization type');
    return res.status(401).send({
      type: 'unaathorized',
      message: 'Unauthorized'
    });
  }
  if (!token) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
    console.error('No token provided');
    return res.status(401).send({
      type: 'unaathorized',
      message: 'Unauthorized'
    });
  };
  try {
    const directus = new Directus<DirectusCollections>(process.env.DIRECTUS_URL || 'http://localhost:8055', {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN || ''
      }
    });
    const wantedSessions = await directus.items('cc_sessions').readByQuery({
      fields: ['*'],
      filter: {
        access_token: {
          _eq: token
        }
      }
    });
    if (wantedSessions.data != null && wantedSessions.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
      console.error('Invalid token');
      return res.status(401).send({
        type: 'unaathorized',
        message: 'Unauthorized'
      });
    }
    const wantedSession = wantedSessions.data![0];
    if(wantedSession.expires < new Date().getTime()) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 401 Unauthorized`);
      console.error('Token expired');
      return res.status(401).send({
        type: 'unaathorized',
        message: 'Unauthorized'
      });
    }
    next();
  } catch (error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`);
    console.error(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error'
    });
  }
}