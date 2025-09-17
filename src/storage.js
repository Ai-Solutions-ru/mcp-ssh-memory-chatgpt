import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import config from './config.js';
import logger from './logger.js';

class Storage {
  constructor(directory) {
    this.directory = directory;
    this.file = path.join(directory, 'users.json');
    this.users = new Map();
    this.initialized = false;
    this.writePromise = Promise.resolve();
  }

  async init() {
    if (this.initialized) return;
    await mkdir(this.directory, { recursive: true });
    try {
      const raw = await readFile(this.file, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          this.users.set(item.id, item);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn({ err: error }, 'Failed to read storage file, starting with empty state');
      }
    }
    this.initialized = true;
  }

  async persist() {
    const data = JSON.stringify([...this.users.values()], null, 2);
    this.writePromise = this.writePromise.then(() => writeFile(this.file, data, 'utf8'));
    await this.writePromise;
  }

  async addUser(user) {
    this.users.set(user.id, user);
    await this.persist();
    return user;
  }

  async updateUser(id, updater) {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updater, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    await this.persist();
    return updated;
  }

  async removeUser(id) {
    const existed = this.users.delete(id);
    if (existed) {
      await this.persist();
    }
    return existed;
  }

  findByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  findByConfigId(configId) {
    for (const user of this.users.values()) {
      if (user.configId === configId) {
        return user;
      }
    }
    return null;
  }

  findByAppUuid(uuid) {
    for (const user of this.users.values()) {
      if (user.coolify?.uuid === uuid) {
        return user;
      }
    }
    return null;
  }

  list() {
    return [...this.users.values()];
  }
}

const storage = new Storage(config.dataDir);

export default storage;
