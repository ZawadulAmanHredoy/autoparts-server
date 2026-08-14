import type { Request, Response } from "express";
import { AppError, ForbiddenError, NotFoundError } from "../middleware/errorHandler.js";
import { Cart } from "../models/cart.model.js";
import { Order, type OrderDoc } from "../models/order.model.js";
import { Part, type PartDoc } from "../models/part.model.js";
import { toPublicPart } from "../services/catalogSerializer.js";
import { confirmOrder } from "../services/order.service.js";
import {
  createPaymentIntent,
  paymentMode,
  verifyPaymentSuccess,
} from "../services/payment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeOrder } from "../services/orderSerializer.js";

const TAX_RATE = 0.08;
const SHIPPING: Record<string, number> = { standard: 8, express: 25 };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** POST /api/orders */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const body = req.body as {
    shippingAddress: { fullName: string; street: string; city: string; state: string; zip: string };
    deliveryMethod: "standard" | "express";
    paymentMethod: "card" | "google-pay" | "apple-pay";
    notes?: string;
  };

  const cart = await Cart.findOne({ userId: user.id });
  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "Your cart is empty");
  }

  const ids = [...new Set(cart.items.map((i) => i.partId))];
  const parts = await Part.find({ _id: { $in: ids } }).lean();
  const map = new Map(parts.map((p) => [String(p._id), toPublicPart(p as PartDoc)]));

  const items = cart.items
    .filter((i) => map.has(i.partId))
    .map((i) => ({
      part: map.get(i.partId)!,
      quantity: i.quantity,
      fitmentConfirmed: i.fitmentConfirmed,
    }));

  if (items.length === 0) throw new AppError(400, "Your cart contains no available parts");

  const outOfStock = items.find((i) => !i.part.inStock || i.part.stockCount < i.quantity);
  if (outOfStock) {
    throw new AppError(409, `${outOfStock.part.name} is out of stock or has insufficient quantity`);
  }

  const subtotal = round2(items.reduce((s, i) => s + i.part.price * i.quantity, 0));
  const shippingFee = SHIPPING[body.deliveryMethod] ?? 8;
  const tax = round2(subtotal * TAX_RATE);
  const total = round2(subtotal + tax + shippingFee);

  const order = await Order.create({
    userId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    items,
    subtotal,
    tax,
    shippingFee,
    total,
    status: "Pending",
    shippingAddress: body.shippingAddress,
    deliveryMethod: body.deliveryMethod,
    paymentMethod: body.paymentMethod,
    notes: body.notes,
  });

  const intent = await createPaymentIntent({
    orderId: order.id,
    amountCents: Math.round(total * 100),
  });
  order.paymentIntentId = intent.paymentIntentId;
  await order.save();

  // Without Stripe configured, confirm the payment immediately (dev mode).
  if (paymentMode() === "dev") {
    const confirmed = await confirmOrder(order.id);
    if (confirmed) order.status = confirmed.status;
    await Cart.updateOne({ userId: user.id }, { $set: { items: [] } });
  }

  res.status(201).json({
    order,
    paymentIntentId: intent.paymentIntentId,
    clientSecret: intent.clientSecret,
    mode: intent.mode,
  });
});

/** GET /api/orders/me */
export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ userId: req.user!.id })
    .sort({ orderDate: -1 })
    .limit(50)
    .lean();
  res.json({ items: (orders as OrderDoc[]).map(serializeOrder) });
});

/** GET /api/orders/:id */
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new NotFoundError("Order");
  if (order.userId !== req.user!.id && req.user!.role !== "admin") {
    throw new ForbiddenError("You do not have access to this order");
  }
  res.json(serializeOrder(order as OrderDoc));
});

/** POST /api/orders/:id/confirm-payment — called by the client after Stripe
 *  confirms the card. Verifies the payment with Stripe before confirming the
 *  order so a payment is never trusted from the client alone. The webhook
 *  remains the authoritative confirm path in production. */
export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new NotFoundError("Order");
  if (order.userId !== req.user!.id && req.user!.role !== "admin") {
    throw new ForbiddenError("You do not have access to this order");
  }

  if (paymentMode() !== "stripe") {
    const confirmed = await confirmOrder(order.id);
    res.json({ order: confirmed });
    return;
  }

  if (!order.paymentIntentId) throw new AppError(409, "Order has no payment intent");
  const paid = await verifyPaymentSuccess(order.paymentIntentId);
  if (!paid) throw new AppError(400, "Payment has not been completed");

  const confirmed = await confirmOrder(order.id);
  res.json({ order: confirmed });
});

/** POST /api/orders/:id/pay — dev-mode confirmation fallback (no Stripe). */
export const payOrderDev = asyncHandler(async (req: Request, res: Response) => {
  if (paymentMode() !== "dev") {
    throw new ForbiddenError("Payment is handled by Stripe in this environment");
  }
  const order = await Order.findById(req.params.id);
  if (!order) throw new NotFoundError("Order");
  if (order.userId !== req.user!.id && req.user!.role !== "admin") {
    throw new ForbiddenError("You do not have access to this order");
  }
  const confirmed = await confirmOrder(order.id);
  res.json({ order: confirmed });
});
