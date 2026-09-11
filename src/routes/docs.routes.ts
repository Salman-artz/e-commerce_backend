import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiDocument } from '../docs/openapi';

export const docsRouter = Router();

docsRouter.get('/json', (_req, res) => {
  res.json(openapiDocument);
});

docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(openapiDocument));