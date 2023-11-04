import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function deleteRateController(req: Request, res: Response) {
  const post: number = +req.params.id;

  if(!post) {
    console.error(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({ 
      type: 'bad_request',
      message: 'Missing post parameter',
    });
  }

  try {
    const directus = getDirectus();
    const session = res.locals.session;
    const wantedRating = await directus.items('cc_ratings').readByQuery({
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
    if(wantedRating.data && wantedRating.data.length > 0) {
      await directus.items('cc_ratings').deleteOne(wantedRating.data[0].id);
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
      );
      return res.status(200).send({
        type: 'success',
        message: 'Rating deleted',
      });
    } else {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).send({
        type: 'not_found',
        message: 'Rating not found',
      });
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