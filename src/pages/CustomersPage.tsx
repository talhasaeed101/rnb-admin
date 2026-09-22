import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import {
  Button,
  Drawer,
  EmptyState,
  PageHeader,
  Pagination,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Customer } from "@/types";

const PAGE_SIZE = 8;

export default function CustomersPage() {
  const { customers, orders, loading, error, refreshAll } = useData();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [customers, search],
  );
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const customerOrders = selected
    ? orders.filter((o) => o.customerId === selected.id || o.customerEmail === selected.email)
    : [];

  return (
    <div>
      <PageHeader title="Customers" subtitle="Profiles and purchase history" />
      <div className="filters">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customers..." />
      </div>
      {error ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__body" style={{ color: "var(--rnb-danger)" }}>
            {error}{" "}
            <Button variant="secondary" size="sm" onClick={() => void refreshAll()}>Retry</Button>
          </div>
        </div>
      ) : null}
      <div className="card">
        {loading && customers.length === 0 ? (
          <div className="card__body">Loading customers...</div>
        ) : pageItems.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Last Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="product-cell">
                          <img src={customer.avatar || ""} alt="" className="thumb" style={{ borderRadius: "50%" }} />
                          <strong>{customer.name}</strong>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.ordersCount}</td>
                      <td>{formatCurrency(customer.totalSpent)}</td>
                      <td>{customer.lastOrder ? formatDate(customer.lastOrder) : "—"}</td>
                      <td><StatusBadge status={customer.status} /></td>
                      <td>
                        <Button size="sm" variant="secondary" onClick={() => setSelected(customer)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
          </>
        )}
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || "Customer"}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Phone:</strong> {selected.phone}</p>
              <p><strong>Joined:</strong> {formatDate(selected.joinedAt)}</p>
              <p><strong>Total spent:</strong> {formatCurrency(selected.totalSpent)}</p>
            </div>
            <div>
              <h4 style={{ marginBottom: 8 }}>Addresses</h4>
              {selected.addresses.map((addr, index) => (
                <p key={index} style={{ fontSize: 13, color: "var(--rnb-muted)", lineHeight: 1.5 }}>
                  {addr.line1}, {addr.city}, {addr.country}
                </p>
              ))}
            </div>
            <div>
              <h4 style={{ marginBottom: 8 }}>Order history</h4>
              {customerOrders.length === 0 ? (
                <p style={{ color: "var(--rnb-muted)", fontSize: 13 }}>No linked orders in dummy data.</p>
              ) : (
                customerOrders.map((order) => (
                  <div key={order.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--rnb-border)" }}>
                    <span>{order.orderNumber}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
