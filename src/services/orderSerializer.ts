import type { Order, Part } from "../shared/index.js";
import type { OrderDoc } from "../models/order.model.js";

/** Serialize a lean/hydrated order doc into the public Order shape. */
export function serializeOrder(doc: OrderDoc): Order {
  return {
    id: String(doc._id),
    userId: doc.userId,
    customerName: doc.customerName,
    customerEmail: doc.customerEmail,
    items: doc.items.map((i) => ({
      part: i.part as unknown as Part,
      quantity: i.quantity,
      fitmentConfirmed: i.fitmentConfirmed,
    })),
    subtotal: doc.subtotal,
    tax: doc.tax,
    shippingFee: doc.shippingFee,
    total: doc.total,
    status: doc.status,
    shippingAddress: doc.shippingAddress,
    deliveryMethod: doc.deliveryMethod,
    paymentMethod: doc.paymentMethod,
    orderDate: (doc.orderDate as Date).toISOString(),
    trackingNumber: doc.trackingNumber ?? undefined,
    notes: doc.notes ?? undefined,
  };
}
