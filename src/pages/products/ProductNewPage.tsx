import { useNavigate } from "react-router-dom";
import { ProductForm, type ProductFormValues } from "@/components/products/ProductForm";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui";

export default function ProductNewPage() {
  const navigate = useNavigate();
  const { addProduct } = useData();
  const { toast } = useToast();

  async function handleSubmit(values: ProductFormValues, mode: "draft" | "publish") {
    try {
      const product = await addProduct({
        ...values,
        status: mode === "draft" ? "draft" : values.status === "draft" ? "active" : values.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
      toast(mode === "draft" ? "Draft saved" : "Product published", "success");
      navigate(`/products/${product.id}`);
    } catch (error: any) {
      toast(error?.message || "Failed to save product", "error");
    }
  }

  return (
    <div>
      <PageHeader title="Add Product" subtitle="Create a new jewelry listing" />
      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/products")}
        submitLabel="Publish Product"
      />
    </div>
  );
}
