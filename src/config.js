import path from 'node:path';

const required = [
  'COOLIFY_API_URL',
  'COOLIFY_API_TOKEN',
  'PROJECT_UUID',
  'BASE_DOMAIN'
];

for (const name of required) {
  if (!process.env[name] || !process.env[name]?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

if (!process.env.SERVER_UUID && !process.env.DESTINATION_UUID) {
  throw new Error('Either SERVER_UUID or DESTINATION_UUID must be provided');
}

const normalizeUrl = (value) => {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, '/');
  return url.toString().replace(/\/$/, '');
};

const coolifyApiUrl = normalizeUrl(process.env.COOLIFY_API_URL);

const factoryBaseUrl = (() => {
  const explicit = process.env.FACTORY_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const fqdn = process.env.FACTORY_FQDN?.trim();
  if (fqdn) {
    return `https://${fqdn.replace(/^https?:\/\//, '')}`;
  }
  throw new Error('Either FACTORY_BASE_URL or FACTORY_FQDN must be provided to build configuration URLs');
})();

const config = {
  port: Number.parseInt(process.env.PORT ?? '8080', 10),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  coolify: {
    apiUrl: coolifyApiUrl,
    token: process.env.COOLIFY_API_TOKEN.trim(),
    projectUuid: process.env.PROJECT_UUID.trim(),
    serverUuid: process.env.SERVER_UUID?.trim() ?? null,
    destinationUuid: process.env.DESTINATION_UUID?.trim() ?? null,
    environmentName: process.env.ENVIRONMENT_NAME?.trim() || 'production'
  },
  domains: {
    base: process.env.BASE_DOMAIN.trim()
  },
  factory: {
    baseUrl: factoryBaseUrl
  },
  dataDir: path.resolve(process.env.DATA_DIR ?? '/data')
};

export default config;
