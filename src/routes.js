import { Router } from 'express';
import { z } from 'zod';
import {
  createUser,
  deleteApplication,
  getProxyConfig,
  restartApplication
} from './services/users.js';
import { ValidationError } from './errors.js';

const createUserSchema = z.object({
  user: z.string().min(1),
  sshPrivateKey: z.string().min(1),
  sshPublicKey: z.string().min(1),
  knownHosts: z.string().min(1)
});

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.post('/users', async (req, res, next) => {
  try {
    const payload = createUserSchema.parse(req.body);
    const result = await createUser(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/configs/:id.json', async (req, res, next) => {
  try {
    const token = req.query.token;
    if (typeof token !== 'string' || !token) {
      throw new ValidationError('token query parameter is required');
    }
    const config = await getProxyConfig(req.params.id, token);
    res.set('Cache-Control', 'no-store');
    res.json(config);
  } catch (error) {
    next(error);
  }
});

router.post('/apps/:uuid/restart', async (req, res, next) => {
  try {
    const response = await restartApplication(req.params.uuid);
    res.json(response ?? { message: 'Restart requested' });
  } catch (error) {
    next(error);
  }
});

router.delete('/apps/:uuid', async (req, res, next) => {
  try {
    const response = await deleteApplication(req.params.uuid);
    res.json(response ?? { message: 'Application deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
