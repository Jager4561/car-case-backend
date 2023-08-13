import { CCAccount, CCSession, CCSessionExtended } from "./auth/auth.model";
import { CCActivation } from "./register/register.model";

export type DirectusCollections = {
  cc_users: CCAccount;
  cc_sessions: CCSession & CCSessionExtended;
  cc_activations: CCActivation
}


export function getCurrentTime(): string {
  const date = new Date();
  const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
  const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
  const miliseconds = date.getMilliseconds() < 10 ? `00${date.getMilliseconds()}` : date.getMilliseconds() < 100 ? `0${date.getMilliseconds()}` : date.getMilliseconds();
  return `${hours}:${minutes}:${seconds}.${miliseconds}`;
}