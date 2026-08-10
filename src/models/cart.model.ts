import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    partId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    fitmentConfirmed: { type: Boolean, default: false },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
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

export type CartDoc = HydratedDocument<InferSchemaType<typeof cartSchema>>;

export const Cart = mongoose.model("Cart", cartSchema);
