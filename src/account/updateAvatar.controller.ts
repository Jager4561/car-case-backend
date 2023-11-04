import { Request, Response } from 'express';
import { getCurrentTime, getDirectus } from '../helpers';
import fs from 'fs';
import fsPromises from 'fs/promises';
import FormData from 'form-data';

export async function updateAvatarController(req: Request, res: Response) {
  const tempPath = process.env.TEMP_PATH || 'temp/';
  const file = req.file;
  
  if(!file) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'field_missing',
      message: 'No file uploaded',
    });
  }

  const acceptableMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if(!acceptableMimeTypes.includes(file.mimetype)) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'invalid_file_type',
      message: 'File is not an image',
    });
  }

  if(file.size > 5 * 1024 * 1024) {
    console.log(
      `[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`
    );
    return res.status(400).send({
      type: 'file_too_large',
      message: 'File size cannot exceed 5MB',
    });
  }

  try {
    const directus = getDirectus();
    const session = res.locals.session;
    let extension = file.mimetype.split('/')[1];
    if(extension === 'jpeg') extension = 'jpg';
    const filename = `${file.filename}.${extension}`;
    await fsPromises.rename(file.path, `${tempPath}${filename}`);
    const payload = new FormData();
    payload.append(
      'file',
      fs.createReadStream(tempPath + filename),
    );
    const uploadedFile = await directus.files.createOne(
      payload,
      {},
      {
        requestOptions: {
          headers: payload.getHeaders(),
        },
      }
    );
    fs.unlinkSync(tempPath + filename);
    if(!uploadedFile) {
      console.log(
        `[${getCurrentTime()}] ${req.method} ${req.url} 500 Bad Request`
      );
      return res.status(500).send({
        type: 'internal_server_error',
        message: 'Internal server error',
      });
    }
    const originalAccount = await directus.items('cc_users').readOne(session.accountId, {
      fields: ['id', 'avatar']
    });
    await directus.items('cc_users').updateOne(session.accountId, {
      avatar: uploadedFile.id
    });
    if(originalAccount.avatar) {
      await directus.files.deleteOne(originalAccount.avatar);
    }
    return res.status(200).send({
      id: originalAccount.id,
      avatar: uploadedFile.id,
    });
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