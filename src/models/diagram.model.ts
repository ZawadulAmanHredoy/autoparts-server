import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const hotspotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    partId: { type: String, required: true },
    partName: { type: String, required: true, trim: true },
    partNumber: { type: String, required: true, trim: true },
    xPercent: { type: Number, required: true, min: 0, max: 100 },
    yPercent: { type: Number, required: true, min: 0, max: 100 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const diagramSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    image: { type: String, required: true, trim: true },
    hotspots: { type: [hotspotSchema], default: [] },
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

diagramSchema.index({ sortOrder: 1 });

export type DiagramDoc = HydratedDocument<InferSchemaType<typeof diagramSchema>>;

export const Diagram = mongoose.model("Diagram", diagramSchema);
