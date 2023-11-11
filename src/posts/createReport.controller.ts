import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function createReportController(req: Request, res: Response) {
  const payload = req.body;

  if(!payload.post) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Post is missing'
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
    const wantedPost = await directus.items('cc_posts').readOne(payload.post);
    if(!wantedPost) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).send({
        type: 'not_found',
        message: 'Post not found'
      });
    }
    await directus.items('cc_posts_reports').createOne({
      post: payload.post,
      account: session ? session.accountId : null,
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
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error'
    });
  }
}