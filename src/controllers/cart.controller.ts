import type { Request, Response } from "express";
import { Cart } from "../models/cart.model.js";
import { Part, type PartDoc } from "../models/part.model.js";
import { toPublicPart } from "../services/catalogSerializer.js";
import { NotFoundError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function loadCart(req: Request) {
  const userId = req.user!.id;
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { upsert: true, new: true },
  );
  return cart;
}

async function hydrateItems(items: { partId: string; quantity: number; fitmentConfirmed: boolean }[]) {
  if (items.length === 0) return [];
  const ids = [...new Set(items.map((i) => i.partId))];
  const parts = await Part.find({ _id: { $in: ids } }).lean();
  const map = new Map(parts.map((p) => [String(p._id), toPublicPart(p as PartDoc)]));
  return items
    .filter((i) => map.has(i.partId))
    .map((i) => ({
      part: map.get(i.partId)!,
      quantity: i.quantity,
      fitmentConfirmed: i.fitmentConfirmed,
    }));
}

/** GET /api/cart */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await loadCart(req);
  const items = await hydrateItems(cart.items);
  const subtotal = items.reduce((sum, i) => sum + i.part.price * i.quantity, 0);
  res.json({ items, subtotal: Math.round(subtotal * 100) / 100 });
});

/** PUT /api/cart/items { partId, quantity } */
export const upsertCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { partId, quantity } = req.body as { partId: string; quantity: number };
  const part = await Part.findById(partId).lean();
  if (!part) throw new NotFoundError("Part");

  const cart = await loadCart(req);
  const existing = cart.items.find((i) => i.partId === partId);
  if (existing) {
    existing.quantity = Math.min(99, quantity);
  } else {
    cart.items.push({ partId, quantity, fitmentConfirmed: false } as never);
  }
  await cart.save();

  const items = await hydrateItems(cart.items);
  const subtotal = items.reduce((sum, i) => sum + i.part.price * i.quantity, 0);
  res.json({ items, subtotal: Math.round(subtotal * 100) / 100 });
});

/** DELETE /api/cart/items/:partId */
export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { partId } = req.params as { partId: string };
  const userId = req.user!.id;
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $pull: { items: { partId } } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const items = await hydrateItems(cart.items);
  const subtotal = items.reduce((sum, i) => sum + i.part.price * i.quantity, 0);
  res.json({ items, subtotal: Math.round(subtotal * 100) / 100 });
});

/** DELETE /api/cart */
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await Cart.updateOne({ userId }, { $set: { items: [] } }, { upsert: true });
  res.json({ items: [], subtotal: 0 });
});
