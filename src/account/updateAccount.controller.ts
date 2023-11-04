import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function updateAccountController(req: Request, res: Response) {
  const session = res.locals.session;
  const name = req.body.name;

  if(!name) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'field_missing',
      message: 'No name provided',
    });
  }

  if(name.length < 3) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'field_too_short',
      message: 'Name must be at least 3 characters',
    });
  }

  if(name.length > 32) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'field_too_long',
      message: 'Name cannot exceed 32 characters',
    });
  }

  try {
    const directus = getDirectus();
    const accountsWithName = await directus.items('cc_users').readByQuery({
      filter: {
        name: {
          _eq: name,
        }
      }
    });
    if(!accountsWithName.data || accountsWithName.data.length > 0) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
      );
      return res.status(400).send({
        type: 'name_taken',
        message: 'Name is already taken',
      });
    }
    const account = await directus.items('cc_users').updateOne(session.accountId, {
      name,
    });
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    return res.status(200).send(account);
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