import { Request, Response } from 'express';
import { getCurrentTime } from '../helpers';

export async function pingController(req: Request, res: Response) {
	console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
	return res.status(200).send({
    type: 'success',
    message: 'Session is active.',
  });
}
