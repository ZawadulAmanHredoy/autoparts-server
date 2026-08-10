import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const maintenanceTaskSchema = new mongoose.Schema(
  {
    mileageInterval: { type: Number, required: true, min: 0, index: true },
    title: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    badge: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    recommendedPartIds: [{ type: String }],
    importance: {
      type: String,
      enum: ["Critical", "Recommended", "Inspection"],
      default: "Recommended",
    },
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

maintenanceTaskSchema.index({ mileageInterval: 1, sortOrder: 1 });

export type MaintenanceTaskDoc = HydratedDocument<InferSchemaType<typeof maintenanceTaskSchema>>;

export const MaintenanceTask = mongoose.model("MaintenanceTask", maintenanceTaskSchema);
