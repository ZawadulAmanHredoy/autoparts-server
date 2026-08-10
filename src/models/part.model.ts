import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const specSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } },
  { _id: false },
);

const compatibilitySchema = new mongoose.Schema(
  {
    makes: [{ type: String, trim: true }],
    models: [{ type: String, trim: true }],
    years: [{ type: Number }],
    engines: [{ type: String, trim: true }],
    universal: { type: Boolean, default: false },
  },
  { _id: false },
);

const partSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true, index: true },
    partNumber: { type: String, required: true, unique: true, trim: true, index: true },
    oemNumber: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    subcategory: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    inStock: { type: Boolean, default: true, index: true },
    stockCount: { type: Number, default: 0, min: 0 },
    images: [{ type: String, trim: true }],
    description: { type: String, trim: true },
    specifications: { type: [specSchema], default: [] },
    compatibility: { type: compatibilitySchema, default: () => ({ makes: [], models: [], years: [], engines: [], universal: false }) },
    difficulty: { type: String, enum: ["Easy", "Moderate", "Professional"], default: "Easy" },
    estimatedInstallTime: { type: String, trim: true },
    warranty: { type: String, trim: true },
    isPopular: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
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

partSchema.index({ name: "text", brand: "text", partNumber: "text", oemNumber: "text", description: "text" });
partSchema.index({ category: 1, inStock: 1, rating: -1, price: 1 });

export type PartDoc = HydratedDocument<InferSchemaType<typeof partSchema>>;

export const Part = mongoose.model("Part", partSchema);
