import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function createReportController(req: Request, res: Response) {
  const payload = req.body;

  if(!payload.comment) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Comment is missing'
    });
  }

  if(!payload.content) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Content is missing'
    });
  }

  const session = res.locals.session;
  try {
    const directus = getDirectus();
    const wantedComment = await directus.items('cc_comments').readOne(payload.comment, {
      fields: ['status']
    });
    if(!wantedComment) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).send({
        type: 'not_found',
        message: 'Post not found'
      });
    }
    if(wantedComment.status !== 'published') {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`
      );
      return res.status(403).send({
        type: 'forbidden',
        message: 'You are not allowed to report this comment'
      });
    }
    await directus.items('cc_comments_reports').createOne({
      comment: payload.comment,
      account: session.accountId,
      content: payload.content,
    });
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    return res.status(200).send({
      type: 'ok',
      message: 'Report created'
    });
  } catch (error) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`
    );
    console.error(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error'
    });
  }
}