import { z } from "zod";

const addressSchema = z.object({
  street: z.string().min(1, "Street is required").max(120),
  city: z.string().min(1, "City is required").max(80),
  state: z.string().min(1, "State is required").max(60),
  zip: z.string().min(1, "ZIP code is required").max(12),
});

/** Order shipping address — the user profile `address` has no fullName. */
const shippingAddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  street: z.string().min(1, "Street is required").max(120),
  city: z.string().min(1, "City is required").max(80),
  state: z.string().min(1, "State is required").max(60),
  zip: z.string().min(1, "ZIP code is required").max(12),
});

const vehicleSchema = z.object({
  year: z.number().int().min(1980).max(2030),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  engine: z.string().max(60).optional(),
  trim: z.string().max(60).optional(),
  vin: z.string().max(17).optional(),
  isPrimary: z.boolean().optional(),
});

const compatibilitySchema = z.object({
  makes: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(),
  years: z.array(z.number().int()).optional(),
  engines: z.array(z.string()).optional(),
  universal: z.boolean().optional(),
});

const partSpecSchema = z.object({
  name: z.string().min(1).max(60),
  value: z.string().min(1).max(120),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2).max(120),
  comment: z.string().min(5).max(2000),
  vehicle: z.string().min(1).max(80).optional(),
});

const partSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(80),
  partNumber: z.string().min(1).max(50),
  oemNumber: z.string().min(1).max(50),
  category: z.string().min(1).max(80),
  subcategory: z.string().min(1).max(80),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  stockCount: z.number().int().min(0),
  images: z.array(z.string().url()).min(1),
  description: z.string().min(1).max(4000),
  specifications: z.array(partSpecSchema).max(50).optional(),
  compatibility: compatibilitySchema.optional(),
  difficulty: z.enum(["Easy", "Moderate", "Professional"]),
  estimatedInstallTime: z.string().max(40),
  warranty: z.string().max(120),
  isPopular: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
});

const cartItemSchema = z.object({
  partId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const orderItemSchema = z.object({
  partId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const orderCreateSchema = z.object({
  shippingAddress: shippingAddressSchema,
  deliveryMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["card", "google-pay", "apple-pay"]),
  notes: z.string().max(1000).optional(),
});

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  address: addressSchema.optional(),
});

const vinDecodeParams = z.object({
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Invalid VIN"),
});

const partQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  category: z.string().max(80).optional(),
  search: z.string().max(120).optional(),
  inStock: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["popular", "rating", "price-asc", "price-desc"]).optional(),
  vehicleId: z.string().max(50).optional(),
});

const orderStatusUpdateSchema = z.object({
  status: z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]),
  trackingNumber: z.string().max(100).optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1).max(50),
});

const partIdParamSchema = z.object({
  partId: z.string().min(1).max(50),
});

const userRoleUpdateSchema = z.object({
  role: z.enum(["customer", "admin"]),
});

const reviewIdParamSchema = z.object({
  id: z.string().min(1).max(50),
  reviewId: z.string().min(1).max(50),
});

export const schemas = {
  address: addressSchema,
  vehicle: vehicleSchema,
  part: partSchema,
  review: reviewSchema,
  cartItem: cartItemSchema,
  orderItem: orderItemSchema,
  orderCreate: orderCreateSchema,
  profileUpdate: profileUpdateSchema,
  vinDecode: vinDecodeParams,
  partQuery: partQuerySchema,
  orderStatusUpdate: orderStatusUpdateSchema,
  idParam: idParamSchema,
  partIdParam: partIdParamSchema,
  userRoleUpdate: userRoleUpdateSchema,
  reviewIdParam: reviewIdParamSchema,
};

export type Address = z.infer<typeof addressSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type PartInput = z.infer<typeof partSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PartQueryInput = z.infer<typeof partQuerySchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;
