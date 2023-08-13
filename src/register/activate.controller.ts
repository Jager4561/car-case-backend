import { Request, Response } from "express";
import { DirectusCollections, getCurrentTime } from "../helpers";
import { CCActivation, CCActivationExtended } from "./register.model";
import { Directus } from "@directus/sdk";

export async function activateController(req: Request, res: Response) {
  const payload: { token: string } = req.body;
  if(!payload || !payload.token) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 400 Bad Request`);
    console.error('Field "token" is required.');
    return res.status(400).send({
      type: 'payload',
      message: 'Field "token" is required.',
    });
  }

  try {
    const directus = new Directus<DirectusCollections>(process.env.DIRECTUS_URL || 'http://localhost:8055', {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN || ''
      }
    });
    const wantedActivations = await directus.items('cc_activations').readByQuery({
      fields: ['*', 'account.id'],
      filter: {
        token: {
          _eq: payload.token
        }
      }
    });
    if(!wantedActivations.data || wantedActivations.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      console.error(`Activation request with token: ${payload.token} not found`);
      return res.status(404).send({
        type: 'invalid_token',
        message: 'Activation request not found',
      });
    }
    const wantedActivation = wantedActivations.data[0] as CCActivationExtended;
    await directus.items('cc_activations').deleteOne(wantedActivation.id);
    const wantedUsers = await directus.items('cc_users').readByQuery({
      fields: ['*'],
      filter: {
        id: {
          _eq: wantedActivation.account.id
        }
      }
    });
    if(!wantedUsers.data || wantedUsers.data.length === 0) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      console.error(`User with id: ${wantedActivation.account.id} not found`);
      return res.status(404).send({
        type: 'user_not_found',
        message: 'User not found',
      });
    }
    const wantedUser = wantedUsers.data[0];
    if(wantedUser.active) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 403 Forbidden`);
      console.error(`User with email: ${wantedActivation.account.id} is already active`);
      return res.status(403).send({
        type: 'already_active',
        message: 'User is already active',
      });
    }
    await directus.items('cc_users').updateOne(wantedUser.id, {
      active: true,
    });
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      type: 'success',
      message: 'User activated',
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