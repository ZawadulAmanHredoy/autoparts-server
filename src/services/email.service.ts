import { env } from "../config/env.js";
import logger from "../config/logger.js";

interface OrderEmailPayload {
  orderId: string;
  customerName: string;
  to: string;
  total: number;
  items: { name: string; quantity: number }[];
}

export async function sendOrderConfirmation(payload: OrderEmailPayload): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.info({ orderId: payload.orderId }, "dev: order confirmation email skipped (no RESEND_API_KEY)");
    return;
  }

  const itemsHtml = payload.items
    .map((i) => `<li>${i.name} × ${i.quantity}</li>`)
    .join("");
  const html = `
    <h2>Thank you for your order, ${payload.customerName}!</h2>
    <p>We're processing order <strong>#${payload.orderId}</strong> ($${payload.total.toFixed(2)}).</p>
    <ul>${itemsHtml}</ul>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AutoParts Express <orders@autoparts.example.com>",
        to: [payload.to],
        subject: `Order #${payload.orderId} confirmed`,
        html,
      }),
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: await res.text() }, "Resend email failed");
    }
  } catch (err) {
    logger.error({ err }, "Resend email failed");
  }
}
