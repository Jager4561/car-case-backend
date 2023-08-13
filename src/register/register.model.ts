import { CCAccount } from "../auth/auth.model";

export interface CCActivation {
  id: string;
  date_created: string;
  token: string;
  resend: boolean;
  used: boolean;
  account: any;
}

export interface CCActivationExtended extends Omit<CCActivation, 'account'> {
  account: CCAccount;
}