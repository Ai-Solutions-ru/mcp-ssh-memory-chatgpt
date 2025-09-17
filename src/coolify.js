import config from './config.js';
import logger from './logger.js';
import { UpstreamError } from './errors.js';

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${config.coolify.token}`
};

const buildUrl = (path, searchParams) => {
  const url = new URL(path, `${config.coolify.apiUrl}/`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url;
};

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    logger.warn({ err: error, text }, 'Failed to parse Coolify response as JSON');
    return { message: text };
  }
};

const request = async (path, { method = 'GET', body = undefined, searchParams } = {}) => {
  const url = buildUrl(path, searchParams);
  const response = await fetch(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new UpstreamError(payload?.message || `Coolify request failed with status ${response.status}`,
      response.status,
      payload);
  }

  return payload;
};

export const createDockerComposeApplication = async (payload) => {
  return request('/applications/dockercompose', {
    method: 'POST',
    body: payload
  });
};

export const restartApplication = async (uuid) => {
  return request(`/applications/${uuid}/restart`, {
    method: 'POST'
  });
};

export const deleteApplication = async (uuid, options = {}) => {
  const params = {
    delete_configurations: true,
    delete_volumes: true,
    docker_cleanup: true,
    delete_connected_networks: true,
    ...options
  };

  return request(`/applications/${uuid}`, {
    method: 'DELETE',
    searchParams: params
  });
};
