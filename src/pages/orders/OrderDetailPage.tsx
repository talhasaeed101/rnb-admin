import { useState } from "react";
import { useParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/utils/format";
import type { OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { orders, updateOrderStatus, loading } = useData();
  const { toast } = useToast();
  const order = orders.find((item) => item.id === id);

  const [status, setStatus] = useState<OrderStatus>(order?.status || "Pending");
  const [courier, setCourier] = useState(order?.courier || "DHL Express");
  const [tracking, setTracking] = useState(order?.trackingNumber || "");

  if (loading && !order) {
    return <div className="card"><div className="card__body">Loading order...</div></div>;
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        action={<Button to="/orders">Back to orders</Button>}
      />
    );
  }

  async function saveStatus() {
    try {
      if (status === "Dispatched") {
        await updateOrderStatus(order!.id, status, {
          courier,
          trackingNumber: tracking || `TRK${Date.now()}`,
          dispatchDate: new Date().toISOString().slice(0, 10),
        });
        toast("Order marked as dispatched", "success");
        return;
      }
      await updateOrderStatus(order!.id, status);
      toast("Order status updated", "success");
    } catch (err: any) {
      toast(err?.message || "Failed to update order", "error");
    }
  }

  const latest = orders.find((item) => item.id === id)!;

  return (
    <div>
      <PageHeader
        title={latest.orderNumber}
        subtitle={`Placed ${formatDate(latest.date)}`}
        actions={<StatusBadge status={latest.status} />}
      />

      <div className="grid-2">
        <div>
          <div className="section-card">
            <h3>Products</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.items.map((item) => (
                    <tr key={`${item.productId}-${item.name}`}>
                      <td>
                        <div className="product-cell">
                          <img src={item.image} alt="" />
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, textAlign: "right", fontSize: 14 }}>
              <p>Subtotal: {formatCurrency(latest.subtotal)}</p>
              <p>Discount: {formatCurrency(latest.discount)}</p>
              <p>Shipping: {formatCurrency(latest.shipping)}</p>
              <p style={{ fontWeight: 700, marginTop: 8 }}>
                Total: {formatCurrency(latest.total)}
              </p>
            </div>
          </div>

          <div className="section-card">
            <h3>Dispatch Flow</h3>
            <div className="form-grid">
              <Select
                label="Order Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                options={STATUSES.map((s) => ({ value: s, label: s }))}
              />
              <div>
                <p className="field-label">Payment</p>
                <StatusBadge status={latest.payment} />
              </div>
              {status === "Dispatched" || latest.status === "Dispatched" || latest.status === "Delivered" ? (
                <>
                  <Input label="Courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
                  <Input
                    label="Tracking Number"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </>
              ) : null}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <Button onClick={() => void saveStatus()}>
                {status === "Dispatched" ? "Mark as Dispatched" : "Update Status"}
              </Button>
            </div>
            {latest.courier ? (
              <p style={{ marginTop: 12, fontSize: 13, color: "var(--rnb-muted)" }}>
                Courier: {latest.courier} · Tracking: {latest.trackingNumber} · Dispatch:{" "}
                {latest.dispatchDate}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="section-card">
            <h3>Customer</h3>
            <p><strong>{latest.customerName}</strong></p>
            <p style={{ color: "var(--rnb-muted)" }}>{latest.customerEmail}</p>
          </div>
          <div className="section-card">
            <h3>Shipping Address</h3>
            <p>{latest.shippingAddress.name}</p>
            <p>{latest.shippingAddress.line1}</p>
            {latest.shippingAddress.line2 ? <p>{latest.shippingAddress.line2}</p> : null}
            <p>
              {latest.shippingAddress.city}, {latest.shippingAddress.state}{" "}
              {latest.shippingAddress.postalCode}
            </p>
            <p>{latest.shippingAddress.country}</p>
          </div>
          <div className="section-card">
            <h3>Billing Address</h3>
            <p>{latest.billingAddress.name}</p>
            <p>{latest.billingAddress.line1}</p>
            <p>
              {latest.billingAddress.city}, {latest.billingAddress.state}{" "}
              {latest.billingAddress.postalCode}
            </p>
            <p>{latest.billingAddress.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
