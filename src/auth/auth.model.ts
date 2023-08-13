export interface CCAccount {
  id: string;
  date_created: string;
  email: string;
  name: string;
  password: string;
  last_password_change: string;
  active: boolean;
}

export interface CCSession {
  id: string;
  date_created: string;
  access_token: string;
  expires: number;
  refresh_token: string;
  refresh_expiration: number;
  account: any
}

export interface CCSessionExtended extends Omit<CCSession, 'account'> {
  account: CCAccount;
}