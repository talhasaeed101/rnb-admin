import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Input,
  PageHeader,
  SearchBar,
  Select,
  StatusBadge,
} from "@/components/ui";
import type { PromoCode, PromoType } from "@/types";

export default function PromoCodesPage() {
  const { promoCodes, addPromoCode, updatePromoCode, deletePromoCode, togglePromoStatus, loading, error, refreshAll } =
    useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage" as PromoType,
    discountValue: 10,
    minOrder: 0,
    maxDiscount: 50 as number | null,
    usageLimit: 100,
    startDate: "2026-01-01",
    expiryDate: "2026-12-31",
    status: "active",
  });

  const filtered = useMemo(
    () =>
      promoCodes.filter((item) =>
        item.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [promoCodes, search],
  );

  function openCreate() {
    setEditing(null);
    setForm({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minOrder: 0,
      maxDiscount: 50,
      usageLimit: 100,
      startDate: "2026-01-01",
      expiryDate: "2026-12-31",
      status: "active",
    });
    setOpen(true);
  }

  function openEdit(promo: PromoCode) {
    setEditing(promo);
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrder: promo.minOrder,
      maxDiscount: promo.maxDiscount,
      usageLimit: promo.usageLimit,
      startDate: promo.startDate,
      expiryDate: promo.expiryDate,
      status: promo.status,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.code.trim()) {
      toast("Promo code is required", "error");
      return;
    }
    try {
      if (editing) {
        await updatePromoCode(editing.id, {
          ...form,
          code: form.code.toUpperCase(),
          status: form.status as PromoCode["status"],
        });
        toast("Promo code updated successfully", "success");
      } else {
        await addPromoCode({
          ...form,
          code: form.code.toUpperCase(),
          status: form.status as PromoCode["status"],
        } as any);
        toast("Promo code created successfully", "success");
      }
      setOpen(false);
    } catch (err: any) {
      toast(err?.message || "Failed to save promo code", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Promo Codes"
        subtitle="Create and manage discounts"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Create Promo Code
          </Button>
        }
      />
      <div className="filters">
        <SearchBar value={search} onChange={setSearch} placeholder="Search codes..." />
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
        {loading && promoCodes.length === 0 ? (
          <div className="card__body">Loading promo codes...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No promo codes" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Type</th>
                  <th>Usage</th>
                  <th>Limit</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((promo) => (
                  <tr key={promo.id}>
                    <td><strong>{promo.code}</strong></td>
                    <td>
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}%`
                        : `$${promo.discountValue}`}
                    </td>
                    <td>{promo.discountType}</td>
                    <td>{promo.usageCount}</td>
                    <td>{promo.usageLimit}</td>
                    <td>{promo.expiryDate}</td>
                    <td><StatusBadge status={promo.status} /></td>
                    <td>
                      <div className="row-actions">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(promo)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            void (async () => {
                              try {
                                await togglePromoStatus(promo.id);
                                toast("Promo status updated", "success");
                              } catch (err: any) {
                                toast(err?.message || "Failed to update promo", "error");
                              }
                            })();
                          }}
                        >
                          {promo.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteId(promo.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Promo Code" : "Create Promo Code"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          <Select
            label="Discount Type"
            value={form.discountType}
            onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as PromoType }))}
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed" },
            ]}
          />
          <Input label="Discount Value" type="number" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: Number(e.target.value) }))} />
          <Input label="Minimum Order" type="number" value={form.minOrder} onChange={(e) => setForm((p) => ({ ...p, minOrder: Number(e.target.value) }))} />
          <Input label="Maximum Discount" type="number" value={form.maxDiscount ?? ""} onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value === "" ? null : Number(e.target.value) }))} />
          <Input label="Usage Limit" type="number" value={form.usageLimit} onChange={(e) => setForm((p) => ({ ...p, usageLimit: Number(e.target.value) }))} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "expired", label: "Expired" },
            ]}
          />
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete promo code"
        message="Remove this promo from local admin state."
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          void (async () => {
            if (!deleteId) return;
            try {
              await deletePromoCode(deleteId);
              toast("Promo code deactivated successfully", "success");
            } catch (err: any) {
              toast(err?.message || "Failed to delete promo code", "error");
            } finally {
              setDeleteId(null);
            }
          })();
        }}
      />
    </div>
  );
}
