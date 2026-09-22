import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  TicketPercent,
  Users,
  ChartColumn,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/promo-codes", label: "Promo Codes", icon: TicketPercent },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/analytics", label: "Analytics", icon: ChartColumn },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  isOpen,
  onNavigate,
}: {
  collapsed?: boolean;
  isOpen?: boolean;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`sidebar${isOpen ? " is-open" : ""}${collapsed ? " is-collapsed-sidebar" : ""}`}
    >
      <div className="sidebar__brand">
        <div className="sidebar__logo">RNB</div>
        <div className="sidebar__brand-text">
          <strong>RNB Collections</strong>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " is-active" : ""}`
            }
            onClick={onNavigate}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__profile">
          <div className="sidebar__avatar">
            {(user?.name || "A").slice(0, 1)}
          </div>
          <div className="sidebar__profile-meta">
            <strong>{user?.name || "Admin"}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <button type="button" className="sidebar__logout" onClick={() => void logout()}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
