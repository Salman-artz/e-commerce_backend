import { createApp } from './app';
import { env } from './config/env';
import { startOrderExpirationJob } from './jobs/order-expiration.job';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  startOrderExpirationJob();
});