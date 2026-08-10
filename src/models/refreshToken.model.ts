import mongoose, { type HydratedDocument, type InferSchemaType, type Model } from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedByTokenHash: { type: String },
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 60 },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = HydratedDocument<InferSchemaType<typeof refreshTokenSchema>>;

export const RefreshToken: Model<RefreshTokenDoc> = mongoose.model<RefreshTokenDoc>(
  "RefreshToken",
  refreshTokenSchema,
);
