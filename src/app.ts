import express from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { authRouter } from './modules/auth/auth.routes';
import { addressRouter } from './modules/addresses/address.routes';
import { cartRouter } from './modules/cart/cart.routes';
import { categoryRouter } from './modules/categories/category.routes';
import { docsRouter } from './routes/docs.routes';
import { productRouter } from './modules/products/product.routes';
import { checkoutRouter } from './modules/orders/checkout.routes';
import { orderRouter } from './modules/orders/order.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { reviewRouter } from './modules/reviews/review.routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { env } from './config/env';

function getCorsOptions(): CorsOptions {
  const allowedOrigins = env.CORS_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be configured in production');
  }

  if (allowedOrigins.length === 0) {
    return {
      origin: true,
      credentials: true
    };
  }

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  };
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(getCorsOptions()));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('dev'));
  
  // Serve static files (like uploaded images)
  app.use('/uploads', express.static('public/uploads'));

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'OK' });
  });

  app.use('/api/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/addresses', addressRouter);
  app.use('/cart', cartRouter);
  app.use('/categories', categoryRouter);
  app.use('/products', productRouter);
  app.use('/checkout', checkoutRouter);
  app.use('/orders', orderRouter);
  app.use('/payments', paymentRouter);
  app.use('/reviews', reviewRouter);
  app.use('/docs', docsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}