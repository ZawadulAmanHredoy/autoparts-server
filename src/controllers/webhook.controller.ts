import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import logger from "../config/logger.js";
import { confirmOrder } from "../services/order.service.js";
import { paymentMode } from "../services/payment.service.js";

/** POST /api/webhooks/stripe — raw JSON body, verified via Stripe signature. */
export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  if (paymentMode() !== "stripe") {
    res.status(200).json({ received: true, mode: "dev" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string" || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ error: "Missing stripe-signature" });
    return;
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY!);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error({ err }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) {
        try {
          await confirmOrder(orderId);
        } catch (err) {
          logger.error({ err, orderId }, "Failed to confirm order from webhook");
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) logger.warn({ orderId }, "Payment failed for order");
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
}
