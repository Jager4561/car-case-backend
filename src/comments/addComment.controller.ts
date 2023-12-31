import { Request, Response } from 'express';
import { AddCommentPayload, PostComment } from './comments.model';
import { getCurrentTime, getDirectus } from '../helpers';

export async function addCommentController(req: Request, res: Response) {
  const payload: AddCommentPayload = req.body;

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
    const comment = await directus.items('cc_comments').createOne({
      status: 'published',
      content: payload.content,
      parent: payload.parent ? payload.parent : null,
      author: session.accountId,
      post: payload.post
    }, {
      fields: ['*', 'author.*']
    });
    if(!comment) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`
      );
      return res.status(500).send({
        type: 'internal_server_error',
        message: 'Internal server error'
      });
    }
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    const commentToSend: PostComment = {
      id: comment.id,
      status: comment.status,
      date_created: comment.date_created,
      date_updated: null,
      author: {
        id: comment.author.id,
        name: comment.author.name,
        avatar: comment.author.avatar
      },
      content: comment.content,
      likes: 0,
      dislikes: 0,
      isLiked: false,
      isDisliked: false,
      isUserComment: true,
      children: []
    };
    return res.status(200).send(commentToSend);
  } catch (error) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`
    );
    console.log(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error'
    });
  }
}