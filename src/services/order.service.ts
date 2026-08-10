import type { OrderDoc } from "../models/order.model.js";
import { Order } from "../models/order.model.js";
import { Part } from "../models/part.model.js";
import { InventoryLog } from "../models/inventoryLog.model.js";
import { refundPayment } from "./payment.service.js";
import { sendOrderConfirmation } from "./email.service.js";
import logger from "../config/logger.js";

/**
 * Confirm a paid order: idempotent, decrements stock atomically, writes an
 * inventory audit trail, emails the customer. If stock ran out since the order
 * was placed, the order is cancelled and the payment refunded.
 */
export async function confirmOrder(orderId: string): Promise<OrderDoc | null> {
  const order = await Order.findById(orderId);
  if (!order || order.status !== "Pending") return order ?? null;

  let insufficientStock = false;

  for (const item of order.items) {
    // Atomic guarded decrement; inStock recomputed in the same pipeline op.
    const res = await Part.updateOne(
      { _id: item.part.id, stockCount: { $gte: item.quantity } },
      [
        {
          $set: {
            stockCount: { $subtract: ["$stockCount", item.quantity] },
            inStock: { $gt: [{ $subtract: ["$stockCount", item.quantity] }, 0] },
          },
        },
      ],
    );

    if (res.matchedCount === 0) {
      insufficientStock = true;
      continue;
    }

    await InventoryLog.create({
      partId: item.part.id,
      orderId,
      delta: -item.quantity,
    });
  }

  if (insufficientStock) {
    order.status = "Cancelled";
    await order.save();
    if (order.paymentIntentId) await refundPayment(order.paymentIntentId);
    logger.warn({ orderId }, "Order cancelled — insufficient stock at payment time");
    return order;
  }

  order.status = "Processing";
  await order.save();

  await sendOrderConfirmation({
    orderId: order.id,
    customerName: order.customerName,
    to: order.customerEmail,
    total: order.total,
    items: order.items.map((i) => ({ name: i.part.name, quantity: i.quantity })),
  });

  logger.info({ orderId }, "Order confirmed");
  return order;
}
