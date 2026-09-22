import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import {
  Button,
  EmptyState,
  PageHeader,
  Pagination,
  SearchBar,
  Select,
  StatusBadge,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/utils/format";

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const { orders, loading, error, refreshAll } = useData();
  const [orderQuery, setOrderQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesOrder =
        !orderQuery ||
        order.orderNumber.toLowerCase().includes(orderQuery.toLowerCase());
      const matchesCustomer =
        !customerQuery ||
        order.customerName.toLowerCase().includes(customerQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(customerQuery.toLowerCase());
      const matchesStatus = !status || order.status === status;
      const matchesPayment = !payment || order.payment === payment;
      return matchesOrder && matchesCustomer && matchesStatus && matchesPayment;
    });
  }, [orders, orderQuery, customerQuery, status, payment]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="Orders" subtitle="Search, filter, and fulfill orders" />
      <div className="filters">
        <SearchBar value={orderQuery} onChange={(v) => { setOrderQuery(v); setPage(1); }} placeholder="Search order..." />
        <SearchBar value={customerQuery} onChange={(v) => { setCustomerQuery(v); setPage(1); }} placeholder="Search customer..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={[
            { value: "", label: "All statuses" },
            { value: "Pending", label: "Pending" },
            { value: "Confirmed", label: "Confirmed" },
            { value: "Processing", label: "Processing" },
            { value: "Dispatched", label: "Dispatched" },
            { value: "Delivered", label: "Delivered" },
            { value: "Cancelled", label: "Cancelled" },
          ]}
        />
        <Select
          value={payment}
          onChange={(e) => { setPayment(e.target.value); setPage(1); }}
          options={[
            { value: "", label: "All payments" },
            { value: "Paid", label: "Paid" },
            { value: "Pending", label: "Pending" },
            { value: "Failed", label: "Failed" },
            { value: "Refunded", label: "Refunded" },
          ]}
        />
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
        {loading && orders.length === 0 ? (
          <div className="card__body">Loading orders...</div>
        ) : pageItems.length === 0 ? (
          <EmptyState title="No orders found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>
                        <strong>{order.customerName}</strong>
                        <div style={{ fontSize: 12, color: "var(--rnb-muted)" }}>{order.customerEmail}</div>
                      </td>
                      <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                      <td>{formatDate(order.date)}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td><StatusBadge status={order.payment} /></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <Button to={`/orders/${order.id}`} size="sm" variant="secondary">
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
    </div>
  );
}
