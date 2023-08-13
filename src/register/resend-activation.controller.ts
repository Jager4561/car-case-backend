import { Request, Response } from "express";
import { DirectusCollections, getCurrentTime } from "../helpers";
import { sendMail } from "../auth/reset-password.controller";
import { Directus } from "@directus/sdk";

export async function resendActivationController(req: Request, res: Response) {
  const payload: { email: string } = req.body;
  if(!payload || !payload.email) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error('Field "email" is required.');
    return res.status(400).send({
      type: 'payload',
      message: 'Field "email" is required.',
    });
  }
  try {
    const directus = new Directus<DirectusCollections>(process.env.DIRECTUS_URL || 'http://localhost:8055', {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN || ''
      }
    });
    const wantedActivations = await directus.items('cc_activations').readByQuery({
      fields: ['*', 'account.email'],
      filter: {
        account: {
          email: {
            _eq: payload.email
          }
        }
      }
    });
    if(wantedActivations.data == null || wantedActivations.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      console.error(`User with email: ${payload.email} doesnt have an active activation request`);
      return res.status(404).send({
        type: 'not_found',
        message: 'Activation request already exists',
      });
    }
    const wantedActivation = wantedActivations.data[0];
    if(wantedActivation.resend) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`);
      console.error(`User with email: ${payload.email} already has an active resend request`);
      return res.status(403).send({
        type: 'activation_not_found',
        message: 'Activation request not found',
      });
    }
    if(wantedActivation.used) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`);
      console.error(`User with email: ${payload.email} already has an active account`);
      return res.status(403).send({
        type: 'already_used',
        message: 'Activation already used',
      });
    }
    await sendMail({
      to: payload.email,
      subject: 'Aktywuj swoje konto w serwisie CarCase',
      template: {
        name: 'activate',
        data: {
          token: wantedActivation.token,
        }
      }
    });
    await directus.items('cc_activations').updateOne(wantedActivation.id, {
      resend: true,
    });
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      type: 'success',
      message: 'Activation request successfully resent.',
    });
  } catch (error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Internal Server Error`);
    console.error(error);
    return res.status(500).send({
      type: 'internal_server_error',
      message: 'Internal server error',
    });
  }
}