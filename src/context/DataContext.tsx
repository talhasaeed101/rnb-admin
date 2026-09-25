import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Category,
  Customer,
  Order,
  OrderStatus,
  Product,
  PromoCode,
} from "@/types";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface DispatchMeta {
  courier?: string;
  trackingNumber?: string;
  dispatchDate?: string;
}

interface DataContextValue {
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  promoCodes: PromoCode[];
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshPromoCodes: () => Promise<void>;
  addProduct: (product: Omit<Product, "id"> | Product) => Promise<Product>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, "id" | "productCount" | "createdAt"> | Category) => Promise<Category>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryStatus: (id: string) => Promise<void>;
  updateOrder: (id: string, patch: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    dispatchMeta?: DispatchMeta,
  ) => Promise<Order>;
  addPromoCode: (promo: Omit<PromoCode, "id" | "usageCount"> | PromoCode) => Promise<PromoCode>;
  updatePromoCode: (id: string, patch: Partial<PromoCode>) => Promise<PromoCode>;
  deletePromoCode: (id: string) => Promise<void>;
  togglePromoStatus: (id: string) => Promise<void>;
  updateCustomer: (id: string, patch: Partial<Customer>) => Promise<Customer>;
}

const DataContext = createContext<DataContextValue | null>(null);

function normalizeProduct(raw: any): Product {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    price: raw.price,
    salePrice: raw.salePrice ?? null,
    description: raw.description || "",
    category: raw.category,
    collection: raw.collection || "",
    images: (raw.images || []).map((img: any, index: number) => ({
      id: img.id || img.publicId || `img-${index}`,
      url: img.url,
      alt: img.alt || raw.name,
      isMain: img.isMain ?? index === 0,
      sortOrder: img.sortOrder ?? index,
      publicId: img.publicId,
      width: img.width,
      height: img.height,
      format: img.format,
    })),
    video: raw.video || null,
    badge: raw.badge ?? null,
    material: raw.material || "",
    care: raw.care || "",
    warranty: raw.warranty || "",
    sku: raw.sku || "",
    stock: raw.stock ?? 0,
    status: raw.status,
    variations: (raw.variations || []).map((v: any, i: number) => ({
      id: v.id || `var-${i}`,
      name: v.name,
      values: v.values || v.options || [],
    })),
    sizes: raw.sizes || [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    ordersCount: raw.ordersCount,
    revenue: raw.revenue,
  };
}

function normalizeOrder(raw: any): Order {
  const statusRaw = raw.status || raw.orderStatus || "pending";
  const paymentRaw = raw.payment || raw.paymentStatus || "pending";
  const capitalize = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    customerId: raw.customerId || "",
    customerName: raw.customerName,
    customerEmail: raw.customerEmail,
    items: raw.items || [],
    date: raw.date || raw.createdAt,
    subtotal: raw.subtotal,
    discount: raw.discount,
    shipping: raw.shipping,
    total: raw.total,
    payment: capitalize(paymentRaw) as Order["payment"],
    status: capitalize(statusRaw) as Order["status"],
    shippingAddress: raw.shippingAddress || {
      name: "",
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    billingAddress: raw.billingAddress || {
      name: "",
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    courier: raw.courier,
    trackingNumber: raw.trackingNumber,
    dispatchDate: raw.dispatchDate,
    notes: raw.notes,
  };
}

function normalizeVideo(video: Product["video"]) {
  if (!video) return null;
  if (typeof video === "string") {
    const url = video.trim();
    if (!url) return null;
    return { url, publicId: "" };
  }
  return {
    url: video.url,
    publicId: video.publicId || "",
    duration: video.duration,
    format: video.format,
    width: video.width,
    height: video.height,
  };
}

function productPayload(product: Partial<Product>) {
  const status =
    product.status === "out_of_stock"
      ? "active"
      : product.status === "active" ||
          product.status === "inactive" ||
          product.status === "draft"
        ? product.status
        : "draft";

  return {
    name: product.name,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice ?? null,
    description: product.description,
    category: product.category,
    collection: product.collection,
    images: (product.images || []).map((img) => ({
      url: img.url,
      publicId: (img as any).publicId || "",
      width: (img as any).width,
      height: (img as any).height,
      format: typeof img.format === "string" ? img.format : undefined,
      bytes: (img as any).bytes,
    })),
    video: normalizeVideo(product.video),
    badge: product.badge,
    material: product.material,
    care: product.care,
    warranty: product.warranty,
    sku: product.sku,
    stock: product.stock,
    status,
    variations: (product.variations || []).map((v) => ({
      name: v.name,
      options: v.values || [],
    })),
    sizes: product.sizes || [],
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    const res = await apiGet<{ success: true; data: any[] }>("/products", {
      limit: 100,
    });
    setProducts(res.data.map(normalizeProduct));
  }, []);

  const refreshCategories = useCallback(async () => {
    const res = await apiGet<{ success: true; data: Category[] }>("/categories");
    setCategories(res.data);
  }, []);

  const refreshOrders = useCallback(async () => {
    const res = await apiGet<{ success: true; data: any[] }>("/orders", {
      limit: 100,
    });
    setOrders(res.data.map(normalizeOrder));
  }, []);

  const refreshCustomers = useCallback(async () => {
    const res = await apiGet<{ success: true; data: Customer[] }>("/customers", {
      limit: 100,
    });
    setCustomers(res.data);
  }, []);

  const refreshPromoCodes = useCallback(async () => {
    const res = await apiGet<{ success: true; data: any[] }>("/promo-codes");
    setPromoCodes(
      res.data.map((p) => ({
        id: p.id,
        code: p.code,
        discountType: p.discountType,
        discountValue: p.discountValue,
        minOrder: p.minOrder ?? p.minimumOrder ?? 0,
        maxDiscount: p.maxDiscount ?? p.maximumDiscount ?? null,
        usageLimit: p.usageLimit,
        usageCount: p.usageCount ?? p.usedCount ?? 0,
        startDate:
          typeof p.startDate === "string"
            ? p.startDate.slice(0, 10)
            : new Date(p.startDate).toISOString().slice(0, 10),
        expiryDate:
          typeof p.expiryDate === "string"
            ? p.expiryDate.slice(0, 10)
            : new Date(p.expiryDate).toISOString().slice(0, 10),
        status: p.status,
      })),
    );
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshProducts(),
        refreshCategories(),
        refreshOrders(),
        refreshCustomers(),
        refreshPromoCodes(),
      ]);
    } catch (err: any) {
      setError(err?.message || "Failed to load data");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [
    refreshProducts,
    refreshCategories,
    refreshOrders,
    refreshCustomers,
    refreshPromoCodes,
  ]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void refreshAll().catch(() => undefined);
    }
    if (!authLoading && !isAuthenticated) {
      setProducts([]);
      setCategories([]);
      setOrders([]);
      setCustomers([]);
      setPromoCodes([]);
    }
  }, [authLoading, isAuthenticated, refreshAll]);

  const addProduct = useCallback(async (product: any) => {
    const res = await apiPost<{ success: true; data: any }>("/products", productPayload(product));
    const created = normalizeProduct(res.data);
    setProducts((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateProduct = useCallback(async (id: string, patch: Partial<Product>) => {
    const current = products.find((p) => p.id === id);
    const merged = { ...current, ...patch } as Product;
    const res = await apiPut<{ success: true; data: any }>(
      `/products/${id}`,
      productPayload(merged),
    );
    const updated = normalizeProduct(res.data);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    await apiDelete<{ success: true; data: { id: string; deleted?: boolean } }>(
      `/products/${id}`,
    );
    await refreshProducts();
  }, [refreshProducts]);

  const toggleProductStatus = useCallback(async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const next =
      product.status === "active"
        ? "inactive"
        : product.status === "inactive"
          ? "active"
          : product.status;
    await updateProduct(id, { status: next });
  }, [products, updateProduct]);

  const addCategory = useCallback(async (category: any) => {
    const res = await apiPost<{ success: true; data: Category }>("/categories", {
      name: category.name,
      slug: category.slug,
      description: category.description,
      status: category.status,
    });
    setCategories((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateCategory = useCallback(async (id: string, patch: Partial<Category>) => {
    const res = await apiPut<{ success: true; data: Category }>(`/categories/${id}`, patch);
    setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    return res.data;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await apiDelete<{ success: true; data: { id: string; deleted?: boolean } }>(
      `/categories/${id}`,
    );
    await refreshCategories();
  }, [refreshCategories]);

  const toggleCategoryStatus = useCallback(async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    await updateCategory(id, {
      status: category.status === "active" ? "inactive" : "active",
    });
  }, [categories, updateCategory]);

  const updateOrder = useCallback(async (id: string, patch: Partial<Order>) => {
    const res = await apiPut<{ success: true; data: any }>(`/orders/${id}`, patch);
    const updated = normalizeOrder(res.data);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    return updated;
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus, dispatchMeta?: DispatchMeta) => {
      if (status === "Dispatched" && dispatchMeta?.courier && dispatchMeta?.trackingNumber) {
        const res = await apiPatch<{ success: true; data: any }>(
          `/orders/${id}/dispatch`,
          {
            courier: dispatchMeta.courier,
            trackingNumber: dispatchMeta.trackingNumber,
          },
        );
        const updated = normalizeOrder(res.data);
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        return updated;
      }
      const res = await apiPatch<{ success: true; data: any }>(
        `/orders/${id}/status`,
        { orderStatus: status.toLowerCase() },
      );
      const updated = normalizeOrder(res.data);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      return updated;
    },
    [],
  );

  const addPromoCode = useCallback(async (promo: any) => {
    const res = await apiPost<{ success: true; data: any }>("/promo-codes", {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minimumOrder: promo.minOrder ?? promo.minimumOrder ?? 0,
      maximumDiscount: promo.maxDiscount ?? promo.maximumDiscount ?? null,
      usageLimit: promo.usageLimit,
      startDate: promo.startDate,
      expiryDate: promo.expiryDate,
      status: promo.status,
    });
    const mapped: PromoCode = {
      id: res.data.id,
      code: res.data.code,
      discountType: res.data.discountType,
      discountValue: res.data.discountValue,
      minOrder: res.data.minOrder ?? res.data.minimumOrder,
      maxDiscount: res.data.maxDiscount ?? res.data.maximumDiscount,
      usageLimit: res.data.usageLimit,
      usageCount: res.data.usageCount ?? res.data.usedCount ?? 0,
      startDate: String(res.data.startDate).slice(0, 10),
      expiryDate: String(res.data.expiryDate).slice(0, 10),
      status: res.data.status,
    };
    setPromoCodes((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const updatePromoCode = useCallback(async (id: string, patch: Partial<PromoCode>) => {
    const res = await apiPut<{ success: true; data: any }>(`/promo-codes/${id}`, {
      ...patch,
      minimumOrder: patch.minOrder,
      maximumDiscount: patch.maxDiscount,
    });
    const mapped: PromoCode = {
      id: res.data.id,
      code: res.data.code,
      discountType: res.data.discountType,
      discountValue: res.data.discountValue,
      minOrder: res.data.minOrder ?? res.data.minimumOrder,
      maxDiscount: res.data.maxDiscount ?? res.data.maximumDiscount,
      usageLimit: res.data.usageLimit,
      usageCount: res.data.usageCount ?? res.data.usedCount ?? 0,
      startDate: String(res.data.startDate).slice(0, 10),
      expiryDate: String(res.data.expiryDate).slice(0, 10),
      status: res.data.status,
    };
    setPromoCodes((prev) => prev.map((p) => (p.id === id ? mapped : p)));
    return mapped;
  }, []);

  const deletePromoCode = useCallback(async (id: string) => {
    await apiDelete(`/promo-codes/${id}`);
    setPromoCodes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "inactive" } : p)),
    );
  }, []);

  const togglePromoStatus = useCallback(async (id: string) => {
    const promo = promoCodes.find((p) => p.id === id);
    if (!promo || promo.status === "expired") return;
    await updatePromoCode(id, {
      status: promo.status === "active" ? "inactive" : "active",
    });
  }, [promoCodes, updatePromoCode]);

  const updateCustomer = useCallback(async (id: string, patch: Partial<Customer>) => {
    const res = await apiPut<{ success: true; data: Customer }>(
      `/customers/${id}`,
      patch,
    );
    setCustomers((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    return res.data;
  }, []);

  const value = useMemo(
    () => ({
      products,
      categories,
      orders,
      customers,
      promoCodes,
      loading,
      error,
      refreshAll,
      refreshProducts,
      refreshCategories,
      refreshOrders,
      refreshCustomers,
      refreshPromoCodes,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductStatus,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategoryStatus,
      updateOrder,
      updateOrderStatus,
      addPromoCode,
      updatePromoCode,
      deletePromoCode,
      togglePromoStatus,
      updateCustomer,
    }),
    [
      products,
      categories,
      orders,
      customers,
      promoCodes,
      loading,
      error,
      refreshAll,
      refreshProducts,
      refreshCategories,
      refreshOrders,
      refreshCustomers,
      refreshPromoCodes,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductStatus,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategoryStatus,
      updateOrder,
      updateOrderStatus,
      addPromoCode,
      updatePromoCode,
      deletePromoCode,
      togglePromoStatus,
      updateCustomer,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
