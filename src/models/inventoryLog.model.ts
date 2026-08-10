import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    partId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    delta: { type: Number, required: true },
    date: { type: Date, default: Date.now },
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

export type InventoryLogDoc = HydratedDocument<InferSchemaType<typeof inventoryLogSchema>>;

export const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);
