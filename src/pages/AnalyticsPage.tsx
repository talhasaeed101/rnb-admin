import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGet } from "@/services/api";
import { useData } from "@/context/DataContext";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatCurrency } from "@/utils/format";
import type { TimeRange } from "@/types";
import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";

type SeriesPoint = { label: string; revenue: number; orders: number };
type TopProduct = { name: string; orders: number; revenue: number };

export default function AnalyticsPage() {
  const { categories, loading: dataLoading, error: dataError } = useData();
  const [range, setRange] = useState<TimeRange>("30d");
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [summary, setSummary] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, revenueRes, topRes] = await Promise.all([
          apiGet<{
            success: true;
            data: {
              totalRevenue: number;
              totalOrders: number;
              totalCustomers: number;
              totalProducts: number;
            };
          }>("/dashboard/summary"),
          apiGet<{ success: true; data: { series: SeriesPoint[] } }>("/dashboard/revenue", {
            range,
          }),
          apiGet<{ success: true; data: TopProduct[] }>("/dashboard/top-products", {
            limit: 8,
          }),
        ]);
        if (cancelled) return;
        setSummary({
          revenue: summaryRes.data.totalRevenue,
          orders: summaryRes.data.totalOrders,
          customers: summaryRes.data.totalCustomers,
          products: summaryRes.data.totalProducts,
        });
        setSeries(revenueRes.data.series || []);
        setTopProducts(topRes.data || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const topCategories = categories
    .filter((c) => c.status === "active")
    .map((c) => ({ name: c.name, revenue: c.productCount || 0 }))
    .slice(0, 8);

  if (loading && series.length === 0) {
    return <div className="card"><div className="card__body">Loading analytics...</div></div>;
  }

  if (error && series.length === 0) {
    return <EmptyState title="Failed to load analytics" description={error} />;
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue, orders, and category performance" />
      {(error || dataError) ? (
        <p style={{ color: "var(--rnb-danger)", marginBottom: 12 }}>{error || dataError}</p>
      ) : null}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <StatCard label="Revenue" value={formatCurrency(summary.revenue)} icon={<DollarSign size={18} />} />
        <StatCard label="Orders" value={summary.orders} icon={<ShoppingBag size={18} />} />
        <StatCard label="Customers" value={summary.customers} icon={<Users size={18} />} />
        <StatCard label="Products" value={summary.products} icon={<Package size={18} />} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <RevenueChart data={series} range={range} onRangeChange={setRange} title="Revenue & Orders Over Time" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card__header"><h3>Top Products</h3></div>
          <div className="table-wrap">
            {topProducts.length === 0 ? (
              <EmptyState title="No product sales yet" />
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
                  {topProducts.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.orders}</td>
                      <td>{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header"><h3>Top Categories</h3></div>
          <div className="card__body" style={{ height: 280 }}>
            {dataLoading ? (
              <p>Loading categories...</p>
            ) : topCategories.length === 0 ? (
              <EmptyState title="No categories yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" name="Products" fill="#005AFA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
