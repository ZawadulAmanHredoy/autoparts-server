import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const partSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    partNumber: { type: String, required: true },
    oemNumber: { type: String },
    category: { type: String },
    subcategory: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    inStock: { type: Boolean },
    stockCount: { type: Number },
    images: [{ type: String }],
    description: { type: String },
    specifications: [
      {
        name: { type: String },
        value: { type: String },
        _id: false,
      },
    ],
    compatibility: {
      makes: [{ type: String }],
      models: [{ type: String }],
      years: [{ type: Number }],
      engines: [{ type: String }],
      universal: { type: Boolean },
    },
    difficulty: { type: String },
    estimatedInstallTime: { type: String },
    warranty: { type: String },
    isPopular: { type: Boolean },
    isBestSeller: { type: Boolean },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    part: { type: partSnapshotSchema, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    fitmentConfirmed: { type: Boolean, default: false },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      index: true,
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    deliveryMethod: { type: String, enum: ["standard", "express"], required: true },
    paymentMethod: { type: String, enum: ["card", "google-pay", "apple-pay"], required: true },
    paymentIntentId: { type: String, index: true },
    trackingNumber: { type: String, trim: true },
    orderDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: unknown, ret: { _id?: unknown; __v?: unknown; [k: string]: unknown }) => {
        ret.id = String(ret._id);
        ret.orderDate = ret.orderDate instanceof Date ? ret.orderDate.toISOString() : ret.orderDate;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

orderSchema.index({ userId: 1, orderDate: -1 });

export type OrderDoc = HydratedDocument<InferSchemaType<typeof orderSchema>>;

export const Order = mongoose.model("Order", orderSchema);
