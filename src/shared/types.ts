export type Role = "customer" | "admin";

export interface User {
  id: string;
  googleId?: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: string;
}

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  engine?: string;
  trim?: string;
  vin?: string;
  isPrimary?: boolean;
}

export interface PartSpec {
  name: string;
  value: string;
}

export interface CompatibilityRule {
  makes?: string[];
  models?: string[];
  years?: number[];
  engines?: string[];
  universal?: boolean;
}

export type InstallDifficulty = "Easy" | "Moderate" | "Professional";

export interface Review {
  id: string;
  partId: string;
  user: string;
  rating: number;
  date: string;
  verifiedPurchase: boolean;
  vehicle: string;
  title: string;
  comment: string;
  likes: number;
}

export interface Part {
  id: string;
  name: string;
  brand: string;
  partNumber: string;
  oemNumber: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  images: string[];
  description: string;
  specifications: PartSpec[];
  compatibility: CompatibilityRule;
  difficulty: InstallDifficulty;
  estimatedInstallTime: string;
  warranty: string;
  isPopular?: boolean;
  isBestSeller?: boolean;
}

export interface CartItem {
  partId: string;
  quantity: number;
  fitmentConfirmed: boolean;
}

export interface CartItemDetailed {
  part: Part;
  quantity: number;
  fitmentConfirmed: boolean;
}

export interface DiagramHotspot {
  id: string;
  partId: string;
  partName: string;
  partNumber: string;
  xPercent: number;
  yPercent: number;
  price: number;
}

export interface Diagram {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  hotspots: DiagramHotspot[];
}

export type MaintenanceImportance = "Critical" | "Recommended" | "Inspection";

export interface MaintenanceTask {
  id: string;
  mileageInterval: number;
  title: string;
  label: string;
  badge: string;
  description: string;
  recommendedPartIds: string[];
  importance: MaintenanceImportance;
}

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export interface OrderItem {
  part: Part;
  quantity: number;
  fitmentConfirmed: boolean;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  orderDate: string;
  trackingNumber?: string;
  notes?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PartListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  inStock?: boolean;
  sort?: "popular" | "rating" | "price-asc" | "price-desc";
  vehicleId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  count?: number;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalParts: number;
  lowStockParts: number;
  outOfStockParts: number;
  recentOrders: Order[];
  topParts: { partId: string; name: string; unitsSold: number; revenue: number }[];
}
