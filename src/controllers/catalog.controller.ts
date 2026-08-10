import type { Response } from "express";
import type { PartListParams } from "../shared/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { Category, type CategoryDoc } from "../models/category.model.js";
import { Part, type PartDoc } from "../models/part.model.js";
import { Review } from "../models/review.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { toPublicPart } from "../services/catalogSerializer.js";

const SORT_FIELDS: Record<NonNullable<PartListParams["sort"]>, Record<string, 1 | -1>> = {
  popular: { isBestSeller: -1, rating: -1, reviewCount: -1 },
  rating: { rating: -1, reviewCount: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
};

export const listCategories = asyncHandler(async (_req, res: Response) => {
  const categories = await Category.find().sort({ sortOrder: 1 }).lean();

  const counts = await Part.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  const withCounts = (categories as CategoryDoc[]).map((c) => ({
    ...c,
    count: countMap.get(c.name) ?? 0,
  }));

  res.json({ items: withCounts });
});

export const listParts = asyncHandler(async (req, res: Response) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    inStock,
    sort = "popular",
    vehicleId,
  } = req.query as unknown as PartListParams;

  const query: Record<string, unknown> = {};

  if (category) {
    const cat = await Category.findOne({ slug: category }).lean();
    if (cat) query.category = cat.name;
    else {
      res.json({ items: [], page, limit, total: 0, totalPages: 0 });
      return;
    }
  }

  if (inStock === true) query.inStock = true;

  if (search?.trim()) {
    query.$text = { $search: search.trim() };
  }

  if (vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId).lean().catch(() => null);
    if (vehicle) {
      // Mirrors shared fitment.ts isCompatible: a part matches when it is
      // universal, or every compatibility rule present on the part allows the
      // vehicle (absent/empty rules are unconstrained).
      const clauses: Record<string, unknown>[] = [];
      const addRule = (field: string, value?: string | number | null): void => {
        if (value === undefined || value === null || value === "") return;
        clauses.push({ $or: [{ [field]: [] }, { [field]: value }] });
      };
      addRule("compatibility.makes", vehicle.make);
      addRule("compatibility.models", vehicle.model);
      addRule("compatibility.years", vehicle.year);
      addRule("compatibility.engines", vehicle.engine);

      query.$or = [
        { "compatibility.universal": true },
        ...(clauses.length ? [{ $and: clauses }] : []),
      ];
    } else {
      res.json({ items: [], page, limit, total: 0, totalPages: 0 });
      return;
    }
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(48, Math.max(1, Number(limit) || 12));

  const [total, docs] = await Promise.all([
    Part.countDocuments(query),
    Part.find(query)
      .sort(SORT_FIELDS[sort] ?? SORT_FIELDS.popular)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
  ]);

  res.json({
    items: (docs as PartDoc[]).map(toPublicPart),
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

export const getPartById = asyncHandler(async (req, res: Response) => {
  const part = await Part.findById(req.params.id).lean();
  if (!part) {
    throw new AppError(404, "Part not found");
  }
  const reviews = await Review.find({ partId: part._id.toString() })
    .sort({ date: -1 })
    .lean();
  res.json({ ...toPublicPart(part as PartDoc), reviews });
});
