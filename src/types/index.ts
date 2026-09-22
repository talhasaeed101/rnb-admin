export type ProductStatus = "active" | "draft" | "inactive" | "out_of_stock";
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";
export type CategoryStatus = "active" | "inactive";
export type PromoStatus = "active" | "inactive" | "expired";
export type PromoType = "percentage" | "fixed";
export type CustomerStatus = "active" | "inactive";
export type StockLevel = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isMain: boolean;
  sortOrder: number;
  publicId?: string;
  width?: number;
  height?: number;
  format?: number | string;
  bytes?: number;
}

export interface ProductVariation {
  id: string;
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  description: string;
  category: string;
  collection: string;
  images: ProductImage[];
  video?: string | { url: string; publicId?: string; duration?: number; format?: string; width?: number; height?: number } | null;
  badge: string | null;
  material: string;
  care: string;
  warranty: string;
  sku: string;
  stock: number;
  status: ProductStatus;
  variations: ProductVariation[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
  ordersCount?: number;
  revenue?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: CategoryStatus;
  productCount: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  date: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: PaymentStatus;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  courier?: string | null;
  trackingNumber?: string | null;
  dispatchDate?: string | null;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string | null;
  status: CustomerStatus;
  avatar?: string;
  addresses: Address[];
  joinedAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: PromoType;
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  expiryDate: string;
  status: PromoStatus;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  todayOrders: number;
  monthlyOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
}

export interface AnalyticsSummary {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  series: RevenuePoint[];
  topProducts: { name: string; revenue: number; orders: number }[];
  topCategories: { name: string; revenue: number; share: number }[];
}

export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  phone: string;
  currency: string;
  timezone: string;
}

export interface AdminProfile {
  name: string;
  email: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  orderNotifications: boolean;
  lowStockNotifications: boolean;
}

export type TimeRange = "7d" | "30d" | "3m" | "6m" | "1y";
