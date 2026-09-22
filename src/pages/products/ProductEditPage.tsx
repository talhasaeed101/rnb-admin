import { useNavigate, useParams } from "react-router-dom";
import { ProductForm, type ProductFormValues } from "@/components/products/ProductForm";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { EmptyState, PageHeader, Button } from "@/components/ui";

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct, loading } = useData();
  const { toast } = useToast();
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

  async function handleSubmit(values: ProductFormValues, mode: "draft" | "publish") {
    try {
      await updateProduct(product!.id, {
        ...values,
        status: mode === "draft" ? "draft" : values.status === "draft" ? "active" : values.status,
      });
      toast(mode === "draft" ? "Draft saved" : "Product updated", "success");
      navigate(`/products/${product!.id}`);
    } catch (error: any) {
      toast(error?.message || "Failed to update product", "error");
    }
  }

  return (
    <div>
      <PageHeader title="Edit Product" subtitle={product.name} />
      <ProductForm
        initial={product}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/products/${product.id}`)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
