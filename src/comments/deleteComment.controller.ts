import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function deleteCommentController(req: Request, res: Response) {
  const commentId = req.params.id;

  if(!commentId) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Comment ID is missing'
    });
  }

  const session = res.locals.session;
  try {
    const directus = getDirectus();
    const wantedComment = await directus.items('cc_comments').readOne(commentId, {
      fields: ['author']
    });
    const childrenComments = await directus.items('cc_comments').readByQuery({
      filter: {
        parent: commentId
      },
      fields: ['id']
    });
    if(!wantedComment) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).send({
        type: 'not_found',
        message: 'Comment not found'
      });
    }
    if(wantedComment.author !== session.accountId) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`
      );
      return res.status(403).send({
        type: 'forbidden',
        message: 'You are not allowed to delete this comment'
      });
    }
    if(childrenComments.data && childrenComments.data.length > 0) {
      await directus.items('cc_comments').updateOne(commentId, {
        status: 'deleted',
        author: null
      });
    } else {
      await directus.items('cc_comments').deleteOne(commentId);
    }
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    return res.status(200).send({
      type: 'ok',
      message: 'Comment deleted'
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