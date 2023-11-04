import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function ratePostController(req: Request, res: Response) {
  const post: number = +req.params.id;
  const rating = req.body.rating;

  if(post == undefined) {
    console.error(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({ 
      type: 'bad_request',
      message: 'Missing post parameter',
    });
  }

  if(rating == undefined) {
    console.error(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({ 
      type: 'bad_request',
      message: 'Missing rating parameter',
    });
  }

  try {
    const directus = getDirectus();
    const session = res.locals.session;
    const existingRating = await directus.items('cc_ratings').readByQuery({
      fields: ['id'],
      filter: {
        _and: [
          {
            post: {
              _eq: post,
            }
          },
          {
            account: {
              _eq: session.accountId,
            }
          }
        ]
      }
    });
    if(existingRating.data && existingRating.data?.length > 0) {
      const wantedRating = existingRating.data[0];
      const updatedRating = await directus.items('cc_ratings').updateOne(wantedRating.id, {
        rating: rating,
      });
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
      );
      return res.status(200).send(updatedRating);
    } else {
      const createdRating = await directus.items('cc_ratings').createOne({
        post: post,
        account: session.accountId,
        rating: rating,
      });
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
      );
      return res.status(200).send(createdRating);
    }
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