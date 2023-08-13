export function validateRegisterPayload(payload: {
  name: string;
  email: string;
  password: string;
}) {
	if (!payload) {
		return 'Missing payload';
	}
	if (!payload.name) {
		return 'Missing name';
	}
	if (!payload.email) {
		return 'Missing email';
	}
	if (!payload.password) {
		return 'Missing password';
	}
	if (payload.password.length < 8) {
		return 'Password must be at least 8 characters long';
	}
	if (!/[a-z]/.test(payload.password)) {
		return 'Password must contain at least one lowercase character';
	}
	if (!/[A-Z]/.test(payload.password)) {
		return 'Password must contain at least one uppercase character';
	}
	if (!/[0-9]/.test(payload.password)) {
		return 'Password must contain at least one number';
	}
	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(payload.password)) {
		return 'Password must contain at least one special character';
	}
	return null;
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase character';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase character';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}
