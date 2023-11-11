import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';
import { PostComment } from './comments.model';

export async function rateCommentController(req: Request, res: Response) {
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

  if(payload.rating === undefined) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Rating is missing'
    });
  }

  try {
    const directus = getDirectus();
    const session = res.locals.session;
    const wantedComment = await directus.items('cc_comments').readOne(commentId);
    if(!wantedComment) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).send({
        type: 'not_found',
        message: 'Comment not found'
      });
    }
    const wantedRating = await directus.items('cc_comments_ratings').readByQuery({
      fields: ['id'],
      filter: {
        comment: {
          _eq: payload.comment
        },
        account: {
          _eq: session.accountId
        }
      }
    });
    if(payload.rating === null) {
      await directus.items('cc_comments_ratings').deleteMany(wantedRating.data ? wantedRating.data.map((rating: any) => rating.id) : []);
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
      );
      return res.status(200).send({
        type: 'ok',
        message: 'Rating removed'
      });
    } else {
      if(wantedRating.data && wantedRating.data.length > 0) {
        await directus.items('cc_comments_ratings').updateOne(wantedRating.data[0].id, {
          rating: payload.rating
        });
      } else {
        await directus.items('cc_comments_ratings').createOne({
          rating: payload.rating,
          comment: payload.comment,
          account: session.accountId
        });
      }
      const updatedComment = await directus.items('cc_comments').readOne(commentId, {
        fields: ['*', 'ratings.*', 'author.*']
      });
      if(!updatedComment) {
        console.log(
          `[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`
        );
        return res.status(500).send({
          type: 'internal_server_error',
          message: 'Internal server error'
        });
      }
      const parsedComment: PostComment = {
        id: updatedComment.id,
        status: updatedComment.status,
        date_created: updatedComment.date_created,
        date_updated: updatedComment.date_updated,
        author: {
          id: updatedComment.author.id,
          name: updatedComment.author.name,
          avatar: updatedComment.author.avatar
        },
        content: updatedComment.content,
        likes: updatedComment.ratings.filter((rating: any) => rating.rating === true).length,
        dislikes: updatedComment.ratings.filter((rating: any) => rating.rating === false).length,
        isLiked: updatedComment.ratings.filter((rating: any) => rating.account === session.accountId && rating.rating === true).length > 0,
        isDisliked: updatedComment.ratings.filter((rating: any) => rating.account === session.accountId && rating.rating === false).length > 0,
        isUserComment: updatedComment.author.id === session.accountId,
      }
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
      );
      return res.status(200).send(parsedComment);
    }
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