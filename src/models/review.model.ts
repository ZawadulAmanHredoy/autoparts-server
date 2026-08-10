import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    partId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    user: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: Date, default: Date.now },
    verifiedPurchase: { type: Boolean, default: false },
    vehicle: { type: String, trim: true },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, trim: true, maxlength: 2000 },
    likes: { type: Number, default: 0, min: 0 },
    likedBy: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: unknown, ret: { _id?: unknown; __v?: unknown; [k: string]: unknown }) => {
        ret.id = String(ret._id);
        ret.date = ret.date instanceof Date ? ret.date.toISOString() : ret.date;
        delete ret.userId;
        delete ret.likedBy;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

reviewSchema.index({ partId: 1, date: -1 });

export type ReviewDoc = HydratedDocument<InferSchemaType<typeof reviewSchema>>;

export const Review = mongoose.model("Review", reviewSchema);
