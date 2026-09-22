import { useEffect, useState } from "react";
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { apiGet } from "@/services/api";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Button, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, stockLevel } from "@/utils/format";
import type { TimeRange } from "@/types";

type Summary = {
  totalRevenue: number;
  totalOrders: number;
  todayOrders: number;
  monthlyOrders: number;
  totalProducts: number;
  totalCustomers: number;
};

type SeriesPoint = { label: string; revenue: number; orders: number };
type TopProduct = { name: string; orders: number; revenue: number; image?: string };
type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  total: number;
  payment: string;
  status: string;
};
type LowStockItem = {
  id: string;
  name: string;
  stock: number;
  status: string;
  image?: string;
};

export default function DashboardPage() {
  const [range, setRange] = useState<TimeRange>("7d");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, revenueRes, recentRes, topRes, lowRes] = await Promise.all([
          apiGet<{ success: true; data: Summary }>("/dashboard/summary"),
          apiGet<{ success: true; data: { series: SeriesPoint[] } }>("/dashboard/revenue", {
            range,
          }),
          apiGet<{ success: true; data: RecentOrder[] }>("/dashboard/recent-orders", {
            limit: 6,
          }),
          apiGet<{ success: true; data: TopProduct[] }>("/dashboard/top-products", {
            limit: 5,
          }),
          apiGet<{ success: true; data: LowStockItem[] }>("/dashboard/low-stock"),
        ]);
        if (cancelled) return;
        setSummary(summaryRes.data);
        setSeries(revenueRes.data.series || []);
        setRecentOrders(recentRes.data || []);
        setTopProducts(topRes.data || []);
        setLowStock(lowRes.data || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  if (loading && !summary) {
    return <div className="card"><div className="card__body">Loading dashboard...</div></div>;
  }

  if (error && !summary) {
    return <EmptyState title="Failed to load dashboard" description={error} />;
  }

  const stats = summary!;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Admin"
        actions={
          <div className="segmented">
            <button type="button" className="is-active">
              Live data
            </button>
          </div>
        }
      />

      {error ? (
        <p style={{ color: "var(--rnb-danger)", marginBottom: 12 }}>{error}</p>
      ) : null}

      <div className="stat-grid">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag size={18} />}
        />
        <StatCard
          label="Today's Orders"
          value={stats.todayOrders}
          icon={<CalendarDays size={18} />}
        />
        <StatCard
          label="Monthly Orders"
          value={stats.monthlyOrders}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Products"
          value={stats.totalProducts}
          icon={<Package size={18} />}
        />
        <StatCard
          label="Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={<Users size={18} />}
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <RevenueChart
          data={series}
          range={range}
          onRangeChange={setRange}
        />

        <div className="card">
          <div className="card__header">
            <h3>Top Selling Products</h3>
            <Button to="/products" variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="table-wrap">
            {topProducts.length === 0 ? (
              <EmptyState title="No sales data yet" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product.name}>
                      <td>
                        <div className="product-cell">
                          {product.image ? <img src={product.image} alt="" /> : null}
                          <div>
                            <strong>{product.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{product.orders || 0}</td>
                      <td>{formatCurrency(product.revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card__header">
            <h3>Recent Orders</h3>
            <Button to="/orders" variant="ghost" size="sm">
              View All Orders
            </Button>
          </div>
          <div className="table-wrap">
            {recentOrders.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>{formatDate(order.date)}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <StatusBadge status={order.payment} />
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <Button to={`/orders/${order.id}`} variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3>Low Stock Products</h3>
          </div>
          <div className="table-wrap">
            {lowStock.length === 0 ? (
              <EmptyState title="No low stock items" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          {product.image ? <img src={product.image} alt="" /> : null}
                          <div>
                            <strong>{product.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{product.stock}</td>
                      <td>
                        <StatusBadge status={stockLevel(product.stock)} />
                      </td>
                      <td>
                        <Button
                          to={`/products/${product.id}/edit`}
                          variant="secondary"
                          size="sm"
                        >
                          Restock
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
