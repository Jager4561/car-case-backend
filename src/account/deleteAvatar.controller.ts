import { Request, Response } from "express";
import { getCurrentTime, getDirectus } from "../helpers";

export async function deleteAvatarController(req: Request, res: Response) {
  const session = res.locals.session;
  try {
    const directus = getDirectus();
    const account = await directus.items("cc_users").readOne(session.accountId, {
      fields: ["id", "avatar"]
    });
    if(!account) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
      return res.status(404).send({
        type: "not_found",
        message: "Account not found"
      });
    }
    if(!account.avatar) {
      console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
      return res.status(200).send({
        id: session.accountId,
        avatar: null
      });
    }
    await directus.items("cc_users").updateOne(session.accountId, {
      avatar: null
    });
    await directus.files.deleteOne(account.avatar);
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
    return res.status(200).send({
      id: session.accountId,
      avatar: null
    });
  } catch (error) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 500 Bad Request`);
    console.error(error);
    return res.status(400).send({
      type: "internal_server_error",
      message: "Internal server error"
    });
  }
}