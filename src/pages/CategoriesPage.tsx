import { useMemo, useRef, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { uploadImages } from "@/services/api";
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
import { formatDate } from "@/utils/format";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    syncCategoryCatalog,
    loading,
    error,
    refreshAll,
  } = useData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: "",
    parentId: "",
    image: "",
    extraChildren: "",
    slug: "",
    description: "",
    status: "active",
  });

  const parents = useMemo(
    () => categories.filter((item) => !item.parentId),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const matched = q
      ? categories.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.parentName || "").toLowerCase().includes(q),
        )
      : categories;
    const top = matched
      .filter((item) => !item.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const rows: Category[] = [];
    for (const parent of top) {
      rows.push(parent);
      const children = matched
        .filter((item) => item.parentId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      rows.push(...children);
    }
    const orphans = matched.filter(
      (item) => item.parentId && !top.some((parent) => parent.id === item.parentId),
    );
    rows.push(...orphans);
    return rows;
  }, [categories, search]);

  function openCreate() {
    setEditing(null);
    setShowAdvanced(false);
    setForm({
      name: "",
      parentId: "",
      image: "",
      extraChildren: "",
      slug: "",
      description: "",
      status: "active",
    });
    setDrawerOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setShowAdvanced(true);
    setForm({
      name: category.name,
      parentId: category.parentId || "",
      image: category.image || "",
      extraChildren: "",
      slug: category.slug,
      description: category.description,
      status: category.status,
    });
    setDrawerOpen(true);
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const res = await uploadImages([files[0]]);
      const url = res.data?.[0]?.url;
      if (!url) throw new Error("Upload did not return an image URL");
      setForm((prev) => ({ ...prev, image: url }));
      toast("Image uploaded", "success");
    } catch (err: any) {
      toast(err?.message || "Image upload failed", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (!form.name.trim()) {
      toast("Category name is required", "error");
      return;
    }
    const children = form.extraChildren
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: form.name,
          parentId: form.parentId || null,
          image: form.image,
          slug: form.slug,
          description: form.description,
          status: form.status as Category["status"],
          children,
          createChildren: children.length > 0,
        });
        toast("Category updated successfully", "success");
      } else {
        await addCategory({
          name: form.name,
          parentId: form.parentId || null,
          image: form.image,
          children,
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
        subtitle="Name and image are enough — slug, description, and subcategories are created automatically"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                void (async () => {
                  setSyncing(true);
                  try {
                    await syncCategoryCatalog();
                    toast("Catalog structure synced", "success");
                  } catch (err: any) {
                    toast(err?.message || "Failed to sync catalog", "error");
                  } finally {
                    setSyncing(false);
                  }
                })();
              }}
            >
              {syncing ? "Syncing..." : "Sync catalog structure"}
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} /> Add Category
            </Button>
          </>
        }
      />

      <div className="filters">
        <SearchBar value={search} onChange={setSearch} placeholder="Search categories..." />
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
                  <th>Parent</th>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: category.parentId ? 20 : 0 }}>
                        {category.image ? (
                          <img
                            src={category.image}
                            alt=""
                            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
                          />
                        ) : null}
                        <div>
                          <strong>{category.name}</strong>
                          <div style={{ color: "var(--rnb-muted)", fontSize: 12 }}>{category.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{category.parentName || "—"}</td>
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
            <Button onClick={() => void save()} disabled={uploading}>
              {editing ? "Save" : "Create"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="Category Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Wallets"
          />
          <Select
            label="Parent Category"
            value={form.parentId}
            onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
            placeholder="None — top-level category"
            options={parents
              .filter((item) => !editing || item.id !== editing.id)
              .map((item) => ({ value: item.id, label: item.name }))}
          />
          <div className="field">
            <span className="field-label">Category Image</span>
            {form.image ? (
              <img
                src={form.image}
                alt=""
                style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, marginBottom: 8 }}
              />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={14} /> {uploading ? "Uploading..." : form.image ? "Replace image" : "Upload image"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => void onUpload(e.target.files)}
            />
          </div>
          <Textarea
            label="Extra subcategories (optional, one per line)"
            value={form.extraChildren}
            onChange={(e) => setForm((prev) => ({ ...prev, extraChildren: e.target.value }))}
            rows={4}
            placeholder={"Sneakers\nRunning Shoes"}
          />
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setShowAdvanced((open) => !open)}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  textAlign: "left",
                  color: "var(--rnb-muted)",
                  cursor: "pointer",
                }}
              >
                {showAdvanced ? "Hide" : "Show"} advanced fields
              </button>
              {showAdvanced ? (
                <>
                  <Input
                    label="Slug"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  />
                  <Textarea
                    label="Description"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
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
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete category"
        message="This permanently deletes the category from the database. Subcategories must be deleted first. Product records are not changed."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          void (async () => {
            if (!deleteId) return;
            try {
              await deleteCategory(deleteId);
              toast("Category deleted", "success");
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
