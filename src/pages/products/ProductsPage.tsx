import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Pagination,
  SearchBar,
  Select,
  StatusBadge,
} from "@/components/ui";
import { formatCurrency } from "@/utils/format";

const PAGE_SIZE = 8;

export default function ProductsPage() {
  const { products, categories, toggleProductStatus, deleteProduct, loading, error, refreshAll } =
    useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [collection, setCollection] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q);
      const matchesCategory = !category || product.category === category;
      const matchesCollection = !collection || product.collection === collection;
      const matchesStatus = !status || product.status === status;
      return matchesSearch && matchesCategory && matchesCollection && matchesStatus;
    });
  }, [products, search, category, collection, status]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const collections = Array.from(new Set(products.map((p) => p.collection)));

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your jewelry catalog"
        actions={
          <Button to="/products/new">
            <Plus size={16} /> Add Product
          </Button>
        }
      />

      <div className="filters">
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search products..."
        />
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({
              value: c.name,
              label: c.parentName ? `${c.parentName} / ${c.name}` : c.name,
            })),
          ]}
        />
        <Select
          value={collection}
          onChange={(e) => {
            setCollection(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "", label: "All collections" },
            ...collections.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "draft", label: "Draft" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </div>

      {error ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__body" style={{ color: "var(--rnb-danger)" }}>
            {error}{" "}
            <Button variant="secondary" size="sm" onClick={() => void refreshAll()}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <div className="card">
        {loading && products.length === 0 ? (
          <div className="card__body">Loading products...</div>
        ) : pageItems.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting filters or create a new product."
            action={
              <Button to="/products/new">
                <Plus size={16} /> Add Product
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Collection</th>
                    <th>Price</th>
                    <th>Sale</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <img
                            src={
                              product.images.find((i) => i.isMain)?.url ||
                              product.images[0]?.url
                            }
                            alt=""
                          />
                          <div>
                            <strong>{product.name}</strong>
                            <span>{product.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{product.collection}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        {product.salePrice != null
                          ? formatCurrency(product.salePrice)
                          : "—"}
                      </td>
                      <td>{product.stock}</td>
                      <td>
                        <StatusBadge status={product.status} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button to={`/products/${product.id}`} variant="ghost" size="sm">
                            View
                          </Button>
                          <Button
                            to={`/products/${product.id}/edit`}
                            variant="secondary"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeactivateId(product.id)}
                          >
                            {product.status === "inactive" ? "Activate" : "Deactivate"}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteId(product.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deactivateId)}
        title="Update product status"
        message="Toggle this product between active and inactive for the storefront catalog."
        confirmLabel="Confirm"
        onCancel={() => setDeactivateId(null)}
        onConfirm={() => {
          void (async () => {
            if (!deactivateId) return;
            try {
              await toggleProductStatus(deactivateId);
              toast("Product status updated", "success");
            } catch (err: any) {
              toast(err?.message || "Failed to update product", "error");
            } finally {
              setDeactivateId(null);
            }
          })();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete product"
        message="This permanently removes the product from the database. It will no longer appear in admin or on the storefront."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          void (async () => {
            if (!deleteId) return;
            try {
              await deleteProduct(deleteId);
              toast("Product deleted", "success");
            } catch (err: any) {
              toast(err?.message || "Failed to delete product", "error");
            } finally {
              setDeleteId(null);
            }
          })();
        }}
      />
    </div>
  );
}
