import type { Request, Response } from "express";
import { AppError, NotFoundError } from "../middleware/errorHandler.js";
import { Part } from "../models/part.model.js";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function partExists(id: string): Promise<boolean> {
  return Part.exists({ _id: id }).then((r) => Boolean(r));
}

/** GET /api/parts/:id/reviews?page=&limit= */
export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  if (!(await partExists(id))) throw new NotFoundError("Part");

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const viewerId = req.user?.id;

  const [total, docs] = await Promise.all([
    Review.countDocuments({ partId: id }),
    Review.find({ partId: id })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const items = docs.map((r) => {
    const { _id, __v, likedBy, userId, date, ...rest } = r as unknown as {
      _id: unknown;
      __v?: unknown;
      likedBy?: string[];
      userId?: string;
      date: Date | string;
      [k: string]: unknown;
    };
    return {
      ...rest,
      id: String(_id),
      date: date instanceof Date ? date.toISOString() : date,
      liked: Boolean(viewerId && likedBy?.includes(viewerId)),
    };
  });

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** POST /api/parts/:id/reviews  (auth) — one review per user per part */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  if (!req.user) throw new AppError(401, "Authentication required");
  if (!(await partExists(id))) throw new NotFoundError("Part");

  const existing = await Review.findOne({ partId: id, userId: req.user.id });
  if (existing) {
    throw new AppError(409, "You have already reviewed this part");
  }

  const body = req.body as { rating: number; title: string; comment: string; vehicle?: string };
  const review = await Review.create({
    partId: id,
    userId: req.user.id,
    user: req.user.name,
    rating: body.rating,
    title: body.title,
    comment: body.comment,
    vehicle: body.vehicle ?? "",
    // Real verified-purchase checks land with Order history (Phase 5).
    verifiedPurchase: false,
  });

  await syncPartRating(id);
  res.status(201).json(review);
});

/** POST /api/parts/:id/reviews/:reviewId/like  (auth) — toggle like */
export const likeReview = asyncHandler(async (req: Request, res: Response) => {
  const { id, reviewId } = req.params as { id: string; reviewId: string };
  if (!req.user) throw new AppError(401, "Authentication required");

  const review = await Review.findOne({ _id: reviewId, partId: id });
  if (!review) throw new NotFoundError("Review");

  const likedBy = review.likedBy ?? [];
  const hasLiked = likedBy.includes(req.user.id);

  const update = hasLiked
    ? { $pull: { likedBy: req.user.id }, $inc: { likes: -1 } }
    : { $addToSet: { likedBy: req.user.id }, $inc: { likes: 1 } };

  await Review.findByIdAndUpdate(reviewId, update, { new: true });
  res.json({ liked: !hasLiked, likes: review.likes + (hasLiked ? -1 : 1) });
});

/** Recompute a part's rating + reviewCount from its reviews. */
export async function syncPartRating(partId: string): Promise<void> {
  const agg = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { partId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (agg.length === 0) return;
  await Part.updateOne(
    { _id: partId },
    { $set: { rating: Math.round(agg[0]!.avg * 10) / 10, reviewCount: agg[0]!.count } },
  );
}
