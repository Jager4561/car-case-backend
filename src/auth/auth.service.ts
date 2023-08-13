export function validateLoginPayload(payload: {
  email: string;
  password: string;
}) {
  if(!payload) {
    return 'Missing payload';
  }
  if(!payload.email ) {
    return 'Missing email';
  }
  if(!payload.password) {
    return 'Missing password';
  }
  const emailRegex = /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm;
  if(!emailRegex.test(payload.email)) {
    return 'Invalid email';
  }
  if(payload.password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  return null;
};
