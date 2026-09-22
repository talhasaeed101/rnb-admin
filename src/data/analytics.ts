import type { AnalyticsSummary, DashboardStats, RevenuePoint, TimeRange } from "@/types";

export const dashboardStats: DashboardStats = {
  totalRevenue: 24580,
  totalOrders: 348,
  todayOrders: 18,
  monthlyOrders: 126,
  totalProducts: 42,
  totalCustomers: 1284,
  revenueChange: 12.4,
  ordersChange: 8.1,
};

const seriesSets: Record<TimeRange, RevenuePoint[]> = {
  "7d": [
    { label: "Mon", revenue: 820, orders: 12 },
    { label: "Tue", revenue: 940, orders: 15 },
    { label: "Wed", revenue: 1100, orders: 18 },
    { label: "Thu", revenue: 980, orders: 14 },
    { label: "Fri", revenue: 1320, orders: 21 },
    { label: "Sat", revenue: 1580, orders: 26 },
    { label: "Sun", revenue: 1210, orders: 19 },
  ],
  "30d": Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    revenue: 600 + ((i * 47) % 900),
    orders: 8 + (i % 15),
  })),
  "3m": [
    { label: "Jul W1", revenue: 4200, orders: 62 },
    { label: "Jul W2", revenue: 4800, orders: 71 },
    { label: "Jul W3", revenue: 5100, orders: 74 },
    { label: "Jul W4", revenue: 4600, orders: 68 },
    { label: "Aug W1", revenue: 5300, orders: 79 },
    { label: "Aug W2", revenue: 5700, orders: 84 },
    { label: "Aug W3", revenue: 6100, orders: 91 },
    { label: "Aug W4", revenue: 5900, orders: 88 },
    { label: "Sep W1", revenue: 6400, orders: 96 },
    { label: "Sep W2", revenue: 6800, orders: 102 },
    { label: "Sep W3", revenue: 7200, orders: 110 },
    { label: "Sep W4", revenue: 7000, orders: 105 },
  ],
  "6m": [
    { label: "Apr", revenue: 14200, orders: 210 },
    { label: "May", revenue: 15800, orders: 238 },
    { label: "Jun", revenue: 17100, orders: 255 },
    { label: "Jul", revenue: 18700, orders: 275 },
    { label: "Aug", revenue: 23000, orders: 342 },
    { label: "Sep", revenue: 24580, orders: 348 },
  ],
  "1y": [
    { label: "Oct", revenue: 9800, orders: 140 },
    { label: "Nov", revenue: 11200, orders: 162 },
    { label: "Dec", revenue: 18600, orders: 290 },
    { label: "Jan", revenue: 12400, orders: 180 },
    { label: "Feb", revenue: 13100, orders: 188 },
    { label: "Mar", revenue: 14800, orders: 210 },
    { label: "Apr", revenue: 14200, orders: 210 },
    { label: "May", revenue: 15800, orders: 238 },
    { label: "Jun", revenue: 17100, orders: 255 },
    { label: "Jul", revenue: 18700, orders: 275 },
    { label: "Aug", revenue: 23000, orders: 342 },
    { label: "Sep", revenue: 24580, orders: 348 },
  ],
};

export function getAnalytics(range: TimeRange): AnalyticsSummary {
  const series = seriesSets[range];
  const revenue = series.reduce((s, p) => s + p.revenue, 0);
  const orders = series.reduce((s, p) => s + p.orders, 0);
  return {
    revenue,
    orders,
    customers: Math.round(orders * 0.72),
    products: 42,
    series,
    topProducts: [
      { name: "Rose Solitaire Ring", revenue: 26299, orders: 91 },
      { name: "Noir Tennis Bracelet", revenue: 22680, orders: 54 },
      { name: "Promise Band", revenue: 17160, orders: 78 },
      { name: "Golden Aura Necklace", revenue: 12400, orders: 86 },
      { name: "Heritage Chain", revenue: 11970, orders: 57 },
    ],
    topCategories: [
      { name: "Rings", revenue: 9800, share: 32 },
      { name: "Necklaces", revenue: 7200, share: 24 },
      { name: "Bracelets", revenue: 6100, share: 20 },
      { name: "Earrings", revenue: 4500, share: 15 },
      { name: "Personalized", revenue: 2800, share: 9 },
    ],
  };
}

export const defaultStoreSettings = {
  storeName: "RNB Collections",
  storeEmail: "hello@rnbcollections.com",
  phone: "+1 (555) 014-2200",
  currency: "USD",
  timezone: "America/New_York",
};

export const defaultAdminProfile = {
  name: "Admin",
  email: "admin@rnbcollections.com",
};

export const defaultNotifications = {
  emailNotifications: true,
  orderNotifications: true,
  lowStockNotifications: true,
};
