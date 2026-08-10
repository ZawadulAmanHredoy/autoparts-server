import type { Response } from "express";
import type { Part as PublicPart, User as PublicUser, OrderStatus } from "../shared/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError, NotFoundError } from "../middleware/errorHandler.js";
import { InventoryLog } from "../models/inventoryLog.model.js";
import { Order, type OrderDoc } from "../models/order.model.js";
import { Part, type PartDoc } from "../models/part.model.js";
import { User, type UserDoc } from "../models/user.model.js";
import { toPublicPart } from "../services/catalogSerializer.js";
import { serializeOrder } from "../services/orderSerializer.js";
import { toPublicUser } from "../services/token.service.js";

/** GET /api/admin/stats */
export const getStats = asyncHandler(async (_req, res: Response) => {
  const [totalOrders, totalRevenueAgg, pendingOrders, totalUsers, totalParts, lowStockParts, outOfStockParts, recentOrders, topParts] =
    await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $nin: ["Cancelled"] } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
      Order.countDocuments({ status: { $in: ["Pending", "Processing"] } }),
      User.countDocuments(),
      Part.countDocuments(),
      Part.countDocuments({ stockCount: { $lte: 10 } }),
      Part.countDocuments({ $or: [{ stockCount: 0 }, { inStock: false }] }),
      Order.find().sort({ orderDate: -1 }).limit(5).lean(),
      Order.aggregate([
        { $match: { status: { $nin: ["Cancelled"] } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.part.id",
            name: { $first: "$items.part.name" },
            unitsSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.part.price"] } },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
      ]),
    ]);

  res.json({
    totalRevenue: Math.round((totalRevenueAgg[0]?.revenue ?? 0) * 100) / 100,
    totalOrders,
    pendingOrders,
    totalUsers,
    totalParts,
    lowStockParts,
    outOfStockParts,
    recentOrders: (recentOrders as OrderDoc[]).map(serializeOrder),
    topParts: topParts.map((t) => ({
      partId: t._id,
      name: t.name,
      unitsSold: t.unitsSold,
      revenue: Math.round(t.revenue * 100) / 100,
    })),
  });
});

/** GET /api/admin/parts — searchable, filterable, paginated */
export const listParts = asyncHandler(async (req, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();

  const query: Record<string, unknown> = {};
  if (category) query.category = category;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { brand: rx }, { partNumber: rx }, { oemNumber: rx }];
  }

  const [total, docs] = await Promise.all([
    Part.countDocuments(query),
    Part.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  res.json({
    items: (docs as PartDoc[]).map(toPublicPart),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

/** POST /api/admin/parts */
export const createPart = asyncHandler(async (req, res: Response) => {
  const body = req.body as Partial<PublicPart>;
  const existing = await Part.findOne({ partNumber: body.partNumber }).lean();
  if (existing) throw new AppError(409, "A part with this part number already exists");

  const doc = await Part.create({
    ...body,
    inStock: (body.stockCount ?? 0) > 0,
    specifications: body.specifications ?? [],
    compatibility: body.compatibility ?? { universal: true },
  });
  res.status(201).json(toPublicPart(doc as unknown as PartDoc));
});

/** PUT /api/admin/parts/:id */
export const updatePart = asyncHandler(async (req, res: Response) => {
  const part = await Part.findById(req.params.id);
  if (!part) throw new NotFoundError("Part");

  const body = req.body as Partial<PublicPart>;
  const fields: (keyof PublicPart)[] = [
    "name", "brand", "partNumber", "oemNumber", "category", "subcategory",
    "price", "originalPrice", "stockCount", "images", "description",
    "specifications", "compatibility", "difficulty", "estimatedInstallTime",
    "warranty", "isPopular", "isBestSeller",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) (part as unknown as Record<string, unknown>)[f] = body[f];
  }
  if (body.stockCount !== undefined) part.inStock = body.stockCount > 0;
  await part.save();

  res.json(toPublicPart(part as unknown as PartDoc));
});

/** DELETE /api/admin/parts/:id */
export const deletePart = asyncHandler(async (req, res: Response) => {
  const part = await Part.findById(req.params.id);
  if (!part) throw new NotFoundError("Part");
  const inOrders = await Order.countDocuments({ "items.part.id": part.id });
  if (inOrders > 0) {
    throw new AppError(409, "This part has order history and cannot be deleted; mark it out of stock instead");
  }
  await part.deleteOne();
  res.json({ success: true });
});

/** GET /api/admin/orders */
export const listOrders = asyncHandler(async (req, res: Response) => {
  const status = String(req.query.status ?? "").trim();
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  const orders = await Order.find(query).sort({ orderDate: -1 }).limit(200).lean();
  res.json({ items: (orders as OrderDoc[]).map(serializeOrder) });
});

/** PATCH /api/admin/orders/:id/status */
export const updateOrderStatus = asyncHandler(async (req, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new NotFoundError("Order");

  const { status, trackingNumber } = req.body as { status: OrderStatus; trackingNumber?: string };
  if (!["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    throw new AppError(400, "Invalid order status");
  }
  order.status = status;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (status === "Cancelled") order.trackingNumber = undefined;
  await order.save();
  res.json({ order });
});

/** GET /api/admin/users */
export const listUsers = asyncHandler(async (req, res: Response) => {
  const search = String(req.query.search ?? "").trim();
  const query: Record<string, unknown> = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { email: rx }];
  }
  const users = await User.find(query).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ items: (users as UserDoc[]).map(toPublicUser) });
});

/** PATCH /api/admin/users/:id/role */
export const updateUserRole = asyncHandler(async (req, res: Response) => {
  const { role } = req.body as { role: "customer" | "admin" };
  if (!["customer", "admin"].includes(role)) throw new AppError(400, "Invalid role");

  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError("User");
  if (user.id === req.user!.id && role !== "admin") {
    throw new AppError(400, "You cannot demote your own admin role");
  }
  user.role = role;
  await user.save();
  res.json({ user: toPublicUser(user as unknown as UserDoc) });
});

/** GET /api/admin/inventory-logs — audit trail for stock changes */
export const listInventoryLogs = asyncHandler(async (req, res: Response) => {
  const logs = await InventoryLog.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ items: logs });
});
