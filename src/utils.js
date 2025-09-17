import { randomBytes, randomUUID } from 'node:crypto';

export const generateId = () => randomUUID();

export const generateToken = (size = 24) => randomBytes(size).toString('base64url');

export const normalizeUsername = (input) => {
  const candidate = input.toLowerCase().trim();
  const sanitized = candidate
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  if (!sanitized) {
    return null;
  }
  return sanitized.slice(0, 63);
};

export const ensureDomainLength = (subdomain, base) => {
  const fqdn = `${subdomain}.${base}`;
  if (fqdn.length > 253) {
    throw new Error('Resulting domain is too long');
  }
  return fqdn;
};
