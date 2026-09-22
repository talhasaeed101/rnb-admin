import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";

const TITLE_MAP: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Welcome back, Admin",
  },
  "/products": { title: "Products", subtitle: "Manage your catalog" },
  "/products/new": { title: "Add Product", subtitle: "Create a new listing" },
  "/categories": { title: "Categories", subtitle: "Organize your catalog" },
  "/orders": { title: "Orders", subtitle: "Track and fulfill orders" },
  "/promo-codes": { title: "Promo Codes", subtitle: "Discounts and campaigns" },
  "/customers": { title: "Customers", subtitle: "Customer relationships" },
  "/analytics": { title: "Analytics", subtitle: "Performance insights" },
  "/settings": { title: "Settings", subtitle: "Store and admin preferences" },
};

function resolveTitle(pathname: string) {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  if (pathname.match(/^\/products\/[^/]+\/edit$/)) {
    return { title: "Edit Product", subtitle: "Update listing details" };
  }
  if (pathname.match(/^\/products\/[^/]+$/)) {
    return { title: "Product Details", subtitle: "View listing" };
  }
  if (pathname.match(/^\/orders\/[^/]+$/)) {
    return { title: "Order Details", subtitle: "Fulfillment and shipping" };
  }
  return { title: "RNB Admin" };
}

export function AdminLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const meta = useMemo(() => {
    const base = resolveTitle(location.pathname);
    if (location.pathname === "/dashboard") {
      return {
        ...base,
        subtitle: `Welcome back, ${user?.name || "Admin"}`,
      };
    }
    return base;
  }, [location.pathname, user?.name]);

  return (
    <div className={`admin-shell${collapsed ? " is-collapsed" : ""}`}>
      {mobileOpen ? (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <Sidebar
        collapsed={collapsed}
        isOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />
      <div className="admin-main">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={() => setCollapsed((value) => !value)}
        style={{ display: "none" }}
      />
    </div>
  );
}
