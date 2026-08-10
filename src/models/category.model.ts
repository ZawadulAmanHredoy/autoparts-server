import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    icon: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: unknown, ret: { _id?: unknown; __v?: unknown; [k: string]: unknown }) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type CategoryDoc = HydratedDocument<InferSchemaType<typeof categorySchema>>;

export const Category = mongoose.model("Category", categorySchema);
