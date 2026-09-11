import { orderRepository } from '../modules/orders/order.repository';

const AUTO_CANCEL_HOURS = 24;
const JOB_INTERVAL_MS = 60 * 60 * 1000;

export function startOrderExpirationJob() {
  const run = async () => {
    const cutoff = new Date(Date.now() - AUTO_CANCEL_HOURS * 60 * 60 * 1000);
    const expiredOrders = await orderRepository.findPendingForExpiration(cutoff);

    for (const order of expiredOrders) {
      await orderRepository.expirePendingOrder(order.id);
    }
  };

  void run();

  return setInterval(() => {
    void run();
  }, JOB_INTERVAL_MS);
}