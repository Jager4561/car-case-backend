import { Request, Response } from 'express';
import { getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';
import { countLikesAndDislikes } from './posts.service';

export async function getSinglePostController(req: Request, res: Response) {
  const id = req.params.id;
  
  if(!id) {
    console.error(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).json({ 
      type: 'bad_request',
      message: 'Missing id parameter',
    });
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
    let wantedPost: any = null;
    try {
      wantedPost = await directus.items('cc_posts').readOne(id, {
        fields: [
          '*',
          'brand.*',
          'vehicle.*',
          'model.*',
          'model_generation.id',
          'model_generation.name',
          'model_generation.image',
          'model_generation.model.*',
          'model_generation.model.brand.*',
          'model_engine.id',
          'model_engine.name',
          'model_engine.capacity',
          'model_engine.horse_power',
          'model_engine.fuel.*',
          'model_hull_type.*',
          'author.id',
          'author.avatar',
          'author.name',
          'comments.*',
          'comments.author.id',
          'comments.author.avatar',
          'comments.author.name',
          'ratings.*',
          'ratings.account',
        ],
      });  
    } catch (error) {
      console.error(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).json({
        type: 'not_found',
        message: 'Post not found',
      });
    }
    if(wantedPost == null || wantedPost.status !== 'published' || wantedPost.model_generation == null || wantedPost.model_engine == null || wantedPost.model_hull_type == null) {
      console.error(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).json({
        type: 'not_found',
        message: 'Post not found',
      });
    }
    const session = res.locals.session;
    const postRatings = countLikesAndDislikes(wantedPost.ratings, session ? session.accountId : null);

    const comments = wantedPost.comments
    .filter((comment: any) => comment.parent == null)
    .map((comment: any) => {
      const ratings = countLikesAndDislikes(comment.ratings, session ? session.accountId : null);

      const childrenComments = wantedPost.comments
        .filter((childComment: any) => childComment.parent === comment.id)
        .map((childComment: any) => {
          const ratings = countLikesAndDislikes(childComment.ratings, session ? session.accountId : null);
          return {
            id: childComment.id,
            date_created: childComment.date_created,
            date_modified: childComment.date_modified,
            author: childComment.author,
            content: childComment.content,
            likes: ratings.likesCount,
            dislikes: ratings.dislikesCount,
            isLiked: ratings.liked,
            isDisliked: ratings.disliked,
            isUserComment:
              session && childComment.author.id === session.accountId,
          };
        }).sort((a: any, b: any) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());;

      return {
        id: comment.id,
        date_created: comment.date_created,
        date_modified: comment.date_modified,
        author: comment.author,
        content: comment.content,
        likes: ratings.likesCount,
        dislikes: ratings.dislikesCount,
        isLiked: ratings.liked,
        isDisliked: ratings.disliked,
        isUserComment:
          session && comment.author.id === session.accountId,
        children: childrenComments
      };
    }).sort((a: any, b: any) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());

    const model = {
      id: wantedPost.model_generation.model.id,
      name: wantedPost.model_generation.model.name,
      brand: wantedPost.model_generation.model.brand,
      generation: {
        id: wantedPost.model_generation.id,
        name: wantedPost.model_generation.name,
        image: wantedPost.model_generation.image,
      },
      hull_type: {
        id: wantedPost.model_hull_type.id,
        name: wantedPost.model_hull_type.name,
      },
      engine: {
        id: wantedPost.model_engine.id,
        name: wantedPost.model_engine.name,
        capacity: wantedPost.model_engine.capacity,
        horse_power: wantedPost.model_engine.horse_power,
        fuel: {
          id: wantedPost.model_engine.fuel.id,
          name: wantedPost.model_engine.fuel.name,
          color: wantedPost.model_engine.fuel.color,
        }
      }
    };
    const formattedPost = {
      id: wantedPost.id,
      date_created: wantedPost.date_created,
      date_modified: wantedPost.date_modified,
      title: wantedPost.title,
      abstract: wantedPost.abstract,
      content: wantedPost.content,
      likes: postRatings.likesCount,
      dislikes: postRatings.dislikesCount,
      isLiked: postRatings.liked,
      isDisliked: postRatings.disliked,
      comments: comments,
      model: model,
      author: wantedPost.author
    };

    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    return res.status(200).json(formattedPost);
  } catch (error) {
    console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 500 Bad Request`
		);
		console.error(error);
		return res.status(400).send({
			type: 'internal_server_error',
			message: 'Internal server error',
		});
  }
}