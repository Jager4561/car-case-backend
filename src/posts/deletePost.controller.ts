import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';

export async function deletePostController(req: Request, res: Response) {
  const id = req.params.id;

  if(!id) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'bad_request',
      message: 'Missing id parameter',
    });
  }

  try {
    const directus = getDirectus();
    const session = res.locals.session;
    const wantedPost = await directus.items('cc_posts').readOne(id, {
      fields: ['id', 'author', 'status', 'content']
    });
    if(!wantedPost) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`
      );
      return res.status(404).send({
        type: 'not_found',
        message: 'Post not found'
      });
    }
    if(wantedPost.author !== session.accountId) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`
      );
      return res.status(403).send({
        type: 'forbidden',
        message: 'You are not allowed to delete this post'
      });
    }
    const postImages: string[] = [];
    wantedPost.content.forEach((section: {
      type: string,
      content: string
    }) => {
      if(section.type === 'image') {
        postImages.push(section.content);
      }
    });
    await directus.items('cc_posts').deleteOne(id);
    if(postImages.length > 0) {
      await directus.files.deleteMany(postImages);
    }
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`
    );
    return res.status(200).send({
      type: 'ok',
      message: 'Post deleted'
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