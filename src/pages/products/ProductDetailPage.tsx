import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/utils/format";

function getVideoUrl(
  video: string | { url: string } | null | undefined,
): string | null {
  if (!video) return null;
  if (typeof video === "string") return video;
  return video.url || null;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, toggleProductStatus, deleteProduct, loading } = useData();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const product = products.find((item) => item.id === id);

  if (loading && !product) {
    return <div className="card"><div className="card__body">Loading product...</div></div>;
  }

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        action={<Button to="/products">Back to products</Button>}
      />
    );
  }

  const main =
    product.images.find((img) => img.isMain)?.url || product.images[0]?.url;
  const videoUrl = getVideoUrl(product.video);

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`${product.category} · ${product.collection}`}
        actions={
          <>
            <Button to={`/products/${product.id}/edit`} variant="secondary">
              Edit Product
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              {product.status === "inactive" ? "Activate" : "Deactivate"} Product
            </Button>
            <Button variant="danger" onClick={() => setDeleteConfirm(true)}>
              Delete Product
            </Button>
          </>
        }
      />

      <div className="grid-2">
        <div className="card">
          <div className="card__body">
            {main ? (
              <img
                src={main}
                alt={product.name}
                style={{ width: "100%", borderRadius: 12, aspectRatio: "1", objectFit: "cover" }}
              />
            ) : null}
            <div className="media-grid" style={{ marginTop: 12 }}>
              {product.images.map((img) => (
                <div key={img.id} className="media-item">
                  <img src={img.url} alt={img.alt} />
                </div>
              ))}
            </div>
            {videoUrl ? (
              <p style={{ marginTop: 12, fontSize: 13 }}>
                Video:{" "}
                <a href={videoUrl} target="_blank" rel="noreferrer">
                  {videoUrl}
                </a>
              </p>
            ) : (
              <p style={{ marginTop: 12, fontSize: 13, color: "var(--rnb-muted)" }}>
                No product video
              </p>
            )}
          </div>
        </div>

        <div className="section-card">
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <StatusBadge status={product.status} />
            {product.badge ? <StatusBadge status="active">{product.badge}</StatusBadge> : null}
          </div>
          <div className="price" style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 28 }}>
              {formatCurrency(product.salePrice ?? product.price)}
            </strong>
            {product.salePrice != null ? <s>{formatCurrency(product.price)}</s> : null}
          </div>
          <p style={{ color: "var(--rnb-muted)", lineHeight: 1.6, marginBottom: 16 }}>
            {product.description}
          </p>
          <div className="form-grid">
            <div><strong>SKU</strong><p>{product.sku}</p></div>
            <div><strong>Stock</strong><p>{product.stock}</p></div>
            <div><strong>Material</strong><p>{product.material}</p></div>
            <div><strong>Warranty</strong><p>{product.warranty}</p></div>
            <div className="full"><strong>Care</strong><p>{product.care}</p></div>
            <div className="full">
              <strong>Variations</strong>
              {product.variations.map((v) => (
                <p key={v.id}>{v.name}: {v.values.join(", ")}</p>
              ))}
            </div>
            <div className="full">
              <strong>Sizes</strong>
              <p>{product.sizes.join(", ") || "—"}</p>
            </div>
            <div><strong>Updated</strong><p>{formatDate(product.updatedAt)}</p></div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Update product status"
        message="This will activate or deactivate the product in MongoDB."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          void (async () => {
            try {
              await toggleProductStatus(product.id);
              toast("Product status updated", "success");
            } catch (err: any) {
              toast(err?.message || "Failed to update product", "error");
            } finally {
              setConfirm(false);
            }
          })();
        }}
      />

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete product"
        message="This permanently removes the product from the database. It will no longer appear in admin or on the storefront."
        confirmLabel="Delete"
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={() => {
          void (async () => {
            try {
              await deleteProduct(product.id);
              toast("Product deleted", "success");
              navigate("/products");
            } catch (err: any) {
              toast(err?.message || "Failed to delete product", "error");
            } finally {
              setDeleteConfirm(false);
            }
          })();
        }}
      />
    </div>
  );
}
