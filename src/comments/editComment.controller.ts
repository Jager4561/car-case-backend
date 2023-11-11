import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';
import { PostComment } from './comments.model';

export async function editCommentController(req: Request, res: Response) {
  const commentId = req.params.id;
  const payload = req.body;

  if(!commentId) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Comment ID is missing'
    });
  }

  if(!payload || !payload.content || payload.content.length === 0) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Content is missing'
    });
  }

  try {
    const directus = getDirectus();
    const wantedComment = await directus.items('cc_comments').readOne(commentId, {
      fields: ['author']
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
    const session = res.locals.session;
    if(wantedComment.author !== session.accountId) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`
      );
      return res.status(403).send({
        type: 'forbidden',
        message: 'You are not allowed to edit this comment'
      });
    }
    const editedComment = await directus.items('cc_comments').updateOne(commentId, {
      date_updated: new Date().toISOString(),
      content: payload.content
    }, {
      fields: ['*', 'author.*']
    });
    if(!editedComment) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`
      );
      return res.status(500).send({
        type: 'internal_server_error',
        message: 'Internal server error'
      });
    }
    const parsedComment: PostComment = {
      id: editedComment.id,
      status: editedComment.status,
      date_created: editedComment.date_created,
      date_updated: editedComment.date_updated,
      author: {
        id: editedComment.author.id,
        name: editedComment.author.name,
        avatar: editedComment.author.avatar
      },
      content: editedComment.content,
      likes: editedComment.ratings.filter((rating: any) => rating.rating === true).length,
      dislikes: editedComment.ratings.filter((rating: any) => rating.rating === false).length,
      isLiked: editedComment.ratings.filter((rating: any) => rating.account === session.accountId && rating.rating === true).length > 0,
      isDisliked: editedComment.ratings.filter((rating: any) => rating.account === session.accountId && rating.rating === false).length > 0,
      isUserComment: true,
    };
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    return res.status(200).send(parsedComment);
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