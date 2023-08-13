import { Request, Response } from "express";
import { validateRegisterPayload } from "./register.service";
import { DirectusCollections, getCurrentTime } from "../helpers";
import { generateString, sendMail } from "../auth/reset-password.controller";
import { Directus } from "@directus/sdk";

export async function registerController(req: Request, res: Response) {
  const payload: {
    name: string,
    email: string,
    password: string,
  } = req.body;
  const validationResult = validateRegisterPayload(payload);
  if(validationResult) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error(validationResult);
    return res.status(400).send({
      type: 'payload',
      message: validationResult,
    });
  }
  try {
    const directus = new Directus<DirectusCollections>(process.env.DIRECTUS_URL || 'http://localhost:8055', {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN || ''
      }
    });
    const wantedUsers = await directus.items('cc_users').readByQuery({
      fields: ['*'],
      filter: {
        email: {
          _eq: payload.email
        }
      }
    });

    if(wantedUsers.data != null && wantedUsers.data.length > 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 409 Conflict`);
      console.error(`User with email: ${payload.email} already exists`);
      return res.status(409).send({
        type: 'email_taken',
        message: 'User already exists',
      });
    }
    const activationCode = generateString(32);
    await sendMail({
      to: payload.email,
      subject: 'Aktywuj swoje konto w serwisie CarCase',
      template: {
        name: 'activate',
        data: {
          token: activationCode,
        }
      }
    });
    const hashedPassword = await directus.utils.hash.generate(payload.password);
    const createdUser = await directus.items('cc_users').createOne({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      active: false,
    });
    await directus.items('cc_activations').createOne({
      token: activationCode,
      account: createdUser!.id
    });
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      type: 'success',
      message: 'Account successfully registered.',
    });
  } catch(error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`);
    console.error(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error',
    });
  }
}