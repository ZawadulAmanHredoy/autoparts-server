import Stripe from "stripe";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

export type PaymentMode = "stripe" | "dev";

export function paymentMode(): PaymentMode {
  return env.STRIPE_SECRET_KEY ? "stripe" : "dev";
}

function getStripe(): Stripe | null {
  return env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string | null;
  amountCents: number;
  mode: PaymentMode;
}

export async function createPaymentIntent(input: {
  orderId: string;
  amountCents: number;
}): Promise<PaymentIntentResult> {
  const stripe = getStripe();
  if (stripe) {
    const pi = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      metadata: { orderId: input.orderId },
      automatic_payment_methods: { enabled: true },
    });
    return {
      paymentIntentId: pi.id,
      clientSecret: pi.client_secret,
      amountCents: pi.amount,
      mode: "stripe",
    };
  }

  logger.info(
    { orderId: input.orderId, amountCents: input.amountCents },
    "dev payment intent created (no STRIPE_SECRET_KEY configured)",
  );
  return {
    paymentIntentId: `pi_dev_${input.orderId}`,
    clientSecret: null,
    amountCents: input.amountCents,
    mode: "dev",
  };
}

export async function refundPayment(paymentIntentId: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  await stripe.refunds.create({ payment_intent: paymentIntentId });
}
