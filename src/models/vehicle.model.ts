import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    year: { type: Number, required: true, min: 1980, max: 2030 },
    make: { type: String, required: true, trim: true, maxlength: 50 },
    model: { type: String, required: true, trim: true, maxlength: 50 },
    engine: { type: String, trim: true, maxlength: 60 },
    trim: { type: String, trim: true, maxlength: 60 },
    vin: { type: String, trim: true, maxlength: 17 },
    isPrimary: { type: Boolean, default: false },
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

vehicleSchema.index({ userId: 1, year: 1, make: 1, model: 1 });

export type VehicleDoc = HydratedDocument<InferSchemaType<typeof vehicleSchema>>;

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
