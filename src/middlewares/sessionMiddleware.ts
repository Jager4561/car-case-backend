import { Directus } from '@directus/sdk';
import { NextFunction, Request, Response } from 'express';

export async function sessionMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const { authorization } = req.headers;
	if (!authorization) {
		res.locals.session = null;
		return next();
	}

	const type = authorization?.split(' ')[0];
	const token = authorization?.split(' ')[1];
	if (type !== 'Bearer' || !token) {
		res.locals.session = null;
		return next();
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
    const wantedSessions = await directus.items('cc_sessions').readByQuery({
      fields: ['*'],
      filter: {
        access_token: {
          _eq: token
        }
      }
    });
    if (wantedSessions.data != null && wantedSessions.data.length === 0) {
      res.locals.session = null;
      return next();
    }
    const wantedSession = wantedSessions.data![0];
    if(wantedSession.expires < new Date().getTime()) {
      res.locals.session = null;
      return next();
    }
    res.locals.session = {
      id: wantedSession.id,
      user: wantedSession.user
    };
    return next;
	} catch (error) {
		res.locals.session = null;
		return next();
	}
}
