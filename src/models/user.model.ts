import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 60 },
    zip: { type: String, trim: true, maxlength: 12 },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: { type: String, trim: true },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
      index: true,
    },
    phone: { type: String, trim: true, maxlength: 20 },
    address: { type: addressSchema },
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

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const User = mongoose.model("User", userSchema);
