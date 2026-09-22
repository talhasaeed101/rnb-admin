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
  Textarea,
} from "@/components/ui";
import { formatDate, slugify } from "@/utils/format";
import type { Category } from "@/types";

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop";

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryStatus, loading, error, refreshAll } =
    useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: DEMO_IMAGE,
    status: "active",
  });

  const filtered = useMemo(
    () =>
      categories.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [categories, search],
  );

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      image: DEMO_IMAGE,
      status: "active",
    });
    setDrawerOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      status: category.status,
    });
    setDrawerOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast("Category name is required", "error");
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: form.name,
          slug: form.slug || slugify(form.name),
          description: form.description,
          image: form.image,
          status: form.status as Category["status"],
        });
        toast("Category updated successfully", "success");
      } else {
        await addCategory({
          name: form.name,
          slug: form.slug || slugify(form.name),
          description: form.description,
          image: form.image || DEMO_IMAGE,
          status: form.status as Category["status"],
        });
        toast("Category created successfully", "success");
      }
      setDrawerOpen(false);
    } catch (err: any) {
      toast(err?.message || "Failed to save category", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize products by category"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Category
          </Button>
        }
      />

      <div className="filters">
        <SearchBar value={search} onChange={setSearch} placeholder="Search categories..." />
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
        {loading && categories.length === 0 ? (
          <div className="card__body">Loading categories...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No categories" action={<Button onClick={openCreate}>Add Category</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="product-cell">
                        <img src={category.image} alt="" />
                        <div>
                          <strong>{category.name}</strong>
                          <span>{category.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>{category.productCount}</td>
                    <td>
                      <StatusBadge status={category.status} />
                    </td>
                    <td>{formatDate(category.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(category)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            void (async () => {
                              try {
                                await toggleCategoryStatus(category.id);
                                toast("Category status updated", "success");
                              } catch (err: any) {
                                toast(err?.message || "Failed to update category", "error");
                              }
                            })();
                          }}
                        >
                          {category.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteId(category.id)}>
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
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Category" : "Add Category"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="Category Name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value,
                slug: editing ? prev.slug : slugify(e.target.value),
              }))
            }
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
          />
          <Input
            label="Image URL"
            value={form.image}
            onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete category"
        message="This will deactivate the category in the catalog."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          void (async () => {
            if (!deleteId) return;
            try {
              await deleteCategory(deleteId);
              toast("Category deactivated successfully", "success");
            } catch (err: any) {
              toast(err?.message || "Failed to delete category", "error");
            } finally {
              setDeleteId(null);
            }
          })();
        }}
      />
    </div>
  );
}
