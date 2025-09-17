import config from '../config.js';
import logger from '../logger.js';
import storage from '../storage.js';
import { buildComposeFile } from '../compose.js';
import { buildProxyConfig } from '../proxyConfig.js';
import {
  createDockerComposeApplication,
  deleteApplication as deleteCoolifyApplication,
  restartApplication as restartCoolifyApplication
} from '../coolify.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  UpstreamError
} from '../errors.js';
import {
  ensureDomainLength,
  generateId,
  generateToken,
  normalizeUsername
} from '../utils.js';

const sanitizeSshBlock = (value, field) => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
  return value.replace(/\r\n/g, '\n').trim();
};

const createCompose = ({ configUrl, sshPrivateKey, sshPublicKey, knownHosts }) =>
  buildComposeFile({
    configUrl,
    sshPrivateKey,
    sshPublicKey,
    knownHosts
  });

export const createUser = async ({ user, sshPrivateKey, sshPublicKey, knownHosts }) => {
  const normalized = normalizeUsername(user);
  if (!normalized) {
    throw new ValidationError('Provided user identifier cannot be converted into a valid subdomain');
  }
  if (normalized.length < 3) {
    throw new ValidationError('User identifier must be at least 3 characters long after normalization');
  }

  const existing = storage.findByUsername(normalized);
  if (existing && existing.status !== 'deleted') {
    throw new ConflictError('User already exists');
  }

  const sshKey = sanitizeSshBlock(sshPrivateKey, 'sshPrivateKey');
  const sshPub = sanitizeSshBlock(sshPublicKey, 'sshPublicKey');
  const known = sanitizeSshBlock(knownHosts, 'knownHosts');

  const fqdn = ensureDomainLength(normalized, config.domains.base);
  const configId = generateId();
  const configToken = generateToken(32);
  const proxyToken = generateToken(32);

  const configUrl = `${config.factory.baseUrl}/configs/${configId}.json?token=${configToken}`;
  const compose = createCompose({
    configUrl,
    sshPrivateKey: sshKey,
    sshPublicKey: sshPub,
    knownHosts: known
  });

  const coolifyPayload = {
    project_uuid: config.coolify.projectUuid,
    environment_name: config.coolify.environmentName,
    docker_compose_raw: compose,
    name: `mcp-${normalized}`,
    description: `MCP workspace for ${normalized}`,
    domains: fqdn,
    instant_deploy: true
  };

  if (config.coolify.serverUuid) {
    coolifyPayload.server_uuid = config.coolify.serverUuid;
  }
  if (config.coolify.destinationUuid) {
    coolifyPayload.destination_uuid = config.coolify.destinationUuid;
  }

  let coolifyResponse;
  try {
    coolifyResponse = await createDockerComposeApplication(coolifyPayload);
  } catch (error) {
    if (error instanceof UpstreamError && error.statusCode === 409) {
      throw new ConflictError(error.message, error.details);
    }
    throw error;
  }

  const now = new Date().toISOString();
  const userRecord = {
    id: generateId(),
    username: normalized,
    displayName: user,
    fqdn,
    configId,
    configToken,
    proxyToken,
    compose,
    ssh: {
      privateKey: sshKey,
      publicKey: sshPub,
      knownHosts: known
    },
    coolify: {
      uuid: coolifyResponse?.uuid ?? null
    },
    status: 'active',
    createdAt: now,
    updatedAt: now
  };

  try {
    await storage.addUser(userRecord);
  } catch (error) {
    logger.error({ err: error }, 'Failed to persist user record, attempting to clean up Coolify application');
    if (userRecord.coolify.uuid) {
      try {
        await deleteCoolifyApplication(userRecord.coolify.uuid);
      } catch (cleanupError) {
        logger.error({ err: cleanupError }, 'Failed to clean up Coolify application after persistence error');
      }
    }
    throw error;
  }

  return {
    user: normalized,
    token: proxyToken,
    fqdn,
    sseUrl: `https://${fqdn}/sse`,
    messageUrl: `https://${fqdn}/mcp`,
    coolify: {
      uuid: userRecord.coolify.uuid
    }
  };
};

export const getProxyConfig = async (configId, token) => {
  const userRecord = storage.findByConfigId(configId);
  if (!userRecord || userRecord.status !== 'active') {
    throw new NotFoundError('Configuration not found');
  }
  if (userRecord.configToken !== token) {
    throw new NotFoundError('Configuration not found');
  }

  return buildProxyConfig({
    baseUrl: `https://${userRecord.fqdn}`,
    authToken: userRecord.proxyToken,
    username: userRecord.username
  });
};

export const restartApplication = async (uuid) => {
  const response = await restartCoolifyApplication(uuid);
  return response;
};

export const deleteApplication = async (uuid) => {
  const response = await deleteCoolifyApplication(uuid);
  const user = storage.findByAppUuid(uuid);
  if (user) {
    await storage.updateUser(user.id, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      ssh: null,
      compose: null
    });
  }
  return response;
};
