import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function deleteAccountController(req: Request, res: Response) {
  const session = res.locals.session;
  
  try {
    const directus = getDirectus();
    const wantedAccount = await directus.items('cc_accounts').readOne(session.accountId, {
      fields: ['id', 'active', 'avatar']
    });
    if(!wantedAccount) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).send({
        type: 'not_found',
        message: 'Account not found'
      });
    }
    if(!wantedAccount.active) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`
      );
      return res.status(403).send({
        type: 'forbidden',
        message: 'Account is not active'
      });
    }
    const authorComments = await directus.items('cc_comments').readByQuery({
      fields: ['id', 'parent'],
      filter: {
        author: {
          _eq: session.accountId
        }
      }
    });
    if(authorComments.data && authorComments.data.length > 0) {
      const toDelete = [];
      const toUpdate = [];
      for(let i = 0; i < authorComments.data.length; i++) {
        const comment = authorComments.data[i];
        if(comment.parent != null) {
          toDelete.push(comment.id);
          continue;
        }
        const hasChildren = await directus.items('cc_comments').readByQuery({
          fields: ['id'],
          filter: {
            account: {
              _neq: session.accountId
            },
            parent: {
              _eq: comment.id
            }
          }
        });
        if(hasChildren.data && hasChildren.data.length > 0) {
          toUpdate.push(comment.id);
        } else {
          toDelete.push(comment.id);
        }
      }

      if(toDelete.length > 0) {
        await directus.items('cc_comments').deleteMany(toDelete);
      }
      if(toUpdate.length > 0) {
        await directus.items('cc_comments').updateMany(toUpdate, {
          status: 'deleted'
        });
      }
    }
    await directus.items('cc_accounts').deleteOne(session.accountId);
    if(wantedAccount.avatar != null) {
      await directus.files.deleteOne(wantedAccount.avatar);
    }
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    return res.status(200).send({
      type: 'ok',
      message: 'Account deleted'
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