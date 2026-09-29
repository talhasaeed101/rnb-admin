import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Edit2, Palette, Plus, Star, Trash2, Upload, X } from "lucide-react";
import type { ColorVariant, Product, ProductImage, ProductVariation, ProductStatus } from "@/types";
import { COLLECTIONS, PRODUCT_BADGES } from "@/data/products";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { deleteImage, uploadImages, uploadVideo } from "@/services/api";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { formatCurrency, slugify } from "@/utils/format";

export type ProductFormValues = Omit<Product, "id" | "createdAt" | "updatedAt" | "ordersCount" | "revenue">;

function emptyValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    price: 0,
    salePrice: null,
    description: "",
    category: "",
    collection: "Signature",
    images: [],
    video: null,
    badge: null,
    material: "",
    care: "",
    warranty: "1 year craftsmanship warranty",
    sku: "",
    stock: 0,
    status: "draft",
    variations: [],
    sizes: [],
    colorVariants: [],
  };
}

interface ColorFormState {
  id: string;
  colorName: string;
  colorCode: string;
  images: ProductImage[];
}

function emptyColorForm(): ColorFormState {
  return {
    id: "",
    colorName: "",
    colorCode: "#3b82f6",
    images: [],
  };
}

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function videoUrl(video: ProductFormValues["video"]): string {
  if (!video) return "";
  if (typeof video === "string") return video;
  return video.url || "";
}

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Publish Product",
}: {
  initial?: Product;
  onSubmit: (values: ProductFormValues, mode: "draft" | "publish") => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const { categories } = useData();
  const { toast } = useToast();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const colorImageInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ProductFormValues>(() =>
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          price: initial.price,
          salePrice: initial.salePrice,
          description: initial.description,
          category: initial.category,
          collection: initial.collection,
          images: initial.images,
          video: initial.video || null,
          badge: initial.badge,
          material: initial.material,
          care: initial.care,
          warranty: initial.warranty,
          sku: initial.sku,
          stock: initial.stock,
          status: initial.status === "out_of_stock" ? "active" : initial.status,
          variations: initial.variations,
          sizes: initial.sizes,
          colorVariants: initial.colorVariants || [],
        }
      : {
          ...emptyValues(),
          category: categories[0]?.name || "",
        },
  );
  const [sizeInput, setSizeInput] = useState("");
  const [optionInput, setOptionInput] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [colorForm, setColorForm] = useState<ColorFormState>(emptyColorForm());
  const [colorUploading, setColorUploading] = useState(false);
  const [colorUploadProgress, setColorUploadProgress] = useState("");
  const [colorFormErrors, setColorFormErrors] = useState<Record<string, string>>({});

  const categoryOptions = useMemo(() => {
    const active = categories.filter((c) => c.status === "active");
    const list = active.length ? active : categories;
    const byParent = new Map<string | null, typeof list>();
    for (const item of list) {
      const key = item.parentId;
      const group = byParent.get(key) || [];
      group.push(item);
      byParent.set(key, group);
    }
    const parents = (byParent.get(null) || []).sort((a, b) => a.name.localeCompare(b.name));
    const options: { value: string; label: string }[] = [];
    for (const parent of parents) {
      options.push({ value: parent.name, label: parent.name });
      const children = (byParent.get(parent.id) || []).sort((a, b) => a.sortOrder - b.sortOrder);
      for (const child of children) {
        options.push({ value: child.name, label: `${parent.name} / ${child.name}` });
      }
    }
    const listed = new Set(options.map((o) => o.value));
    for (const item of list) {
      if (!listed.has(item.name)) {
        options.push({
          value: item.name,
          label: item.parentName ? `${item.parentName} / ${item.name}` : item.name,
        });
      }
    }
    return options;
  }, [categories]);

  useEffect(() => {
    if (initial) return;
    if (values.category) return;
    const first = categoryOptions[0]?.value;
    if (first) {
      setValues((prev) => (prev.category ? prev : { ...prev, category: first }));
    }
  }, [categoryOptions, initial, values.category]);

  function patch<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleName(name: string) {
    setValues((prev) => ({
      ...prev,
      name,
      slug: prev.slug && initial ? prev.slug : slugify(name),
    }));
  }

  async function handleImageFiles(files: File[] | FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files).filter(
      (file) =>
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif)$/i.test(file.name),
    );
    if (!selected.length) {
      toast("Please choose image files (JPEG, PNG, WebP, or GIF)", "error");
      return;
    }
    setUploadingImages(true);
    setUploadProgress(`Uploading 0/${selected.length}`);
    try {
      const res = await uploadImages(selected, (done, total) => {
        setUploadProgress(`Uploading ${done}/${total}`);
      });
      const uploaded: ProductImage[] = (res.data || []).map((img: any, index: number) => ({
        id: img.publicId || `img-${Date.now()}-${index}`,
        url: img.url,
        alt: img.alt || values.name || "Product image",
        isMain: false,
        sortOrder: index,
        publicId: img.publicId,
        width: img.width,
        height: img.height,
        format: img.format,
        bytes: img.bytes,
      }));
      if (!uploaded.length) {
        throw new Error("Upload did not return any images");
      }
      setValues((prev) => {
        const start = prev.images.length;
        const incoming = uploaded.map((img, index) => ({
          ...img,
          isMain: start === 0 && index === 0,
          sortOrder: start + index,
        }));
        const next = [...prev.images, ...incoming].map((img, sortOrder) => ({
          ...img,
          sortOrder,
        }));
        if (next.length && !next.some((img) => img.isMain)) {
          next[0] = { ...next[0], isMain: true };
        }
        return { ...prev, images: next };
      });
      const failedCount = res.failed?.length || 0;
      if (failedCount) {
        toast(`${uploaded.length} uploaded, ${failedCount} failed`, "error");
      } else {
        toast(
          uploaded.length === 1
            ? "Image uploaded successfully"
            : `${uploaded.length} images uploaded successfully`,
          "success",
        );
      }
    } catch (error: any) {
      toast(error?.message || "Image upload failed", "error");
    } finally {
      setUploadingImages(false);
      setUploadProgress("");
    }
  }

  async function handleVideoFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await uploadVideo(file);
      const video = res.data;
      patch("video", {
        url: video.url,
        publicId: video.publicId,
        duration: video.duration,
        format: video.format,
        width: video.width,
        height: video.height,
      });
      toast("Video uploaded successfully", "success");
    } catch (error: any) {
      toast(error?.message || "Video upload failed", "error");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  function removeImage(id: string) {
    const current = values.images.find((img) => img.id === id);
    const publicId = current?.publicId;
    const next = values.images.filter((img) => img.id !== id);
    if (next.length && !next.some((img) => img.isMain)) {
      next[0] = { ...next[0], isMain: true };
    }
    patch(
      "images",
      next.map((img, index) => ({ ...img, sortOrder: index })),
    );
    if (publicId) {
      void deleteImage(publicId).catch(() => {
        toast("Image removed from product. Storage cleanup failed.", "error");
      });
    }
  }

  function setMain(id: string) {
    const index = values.images.findIndex((img) => img.id === id);
    if (index < 0) return;
    const next = [...values.images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    patch(
      "images",
      next.map((img, sortOrder) => ({
        ...img,
        sortOrder,
        isMain: sortOrder === 0,
      })),
    );
  }

  function moveImage(id: string, direction: -1 | 1) {
    const index = values.images.findIndex((img) => img.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= values.images.length) return;
    const next = [...values.images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    patch(
      "images",
      next.map((img, sortOrder) => ({
        ...img,
        sortOrder,
        isMain: sortOrder === 0,
      })),
    );
  }

  function addVariation() {
    const variation: ProductVariation = {
      id: `var-${Date.now()}`,
      name: "Color",
      values: [],
    };
    patch("variations", [...values.variations, variation]);
  }

  function updateVariation(id: string, patchVar: Partial<ProductVariation>) {
    patch(
      "variations",
      values.variations.map((item) =>
        item.id === id ? { ...item, ...patchVar } : item,
      ),
    );
  }

  function removeVariation(id: string) {
    patch(
      "variations",
      values.variations.filter((item) => item.id !== id),
    );
  }

  function addVariationValue(id: string) {
    const text = (optionInput[id] || "").trim();
    if (!text) return;
    const current = values.variations.find((item) => item.id === id);
    if (!current || current.values.includes(text)) return;
    updateVariation(id, { values: [...current.values, text] });
    setOptionInput((prev) => ({ ...prev, [id]: "" }));
  }

  function addSize() {
    const text = sizeInput.trim();
    if (!text || values.sizes.includes(text)) return;
    patch("sizes", [...values.sizes, text]);
    setSizeInput("");
  }

  function openAddColorModal() {
    setColorForm({ ...emptyColorForm(), id: `color-${Date.now()}` });
    setColorFormErrors({});
    setColorModalOpen(true);
  }

  function openEditColorModal(cv: ColorVariant) {
    setColorForm({
      id: cv.id,
      colorName: cv.colorName,
      colorCode: cv.colorCode,
      images: [...cv.images],
    });
    setColorFormErrors({});
    setColorModalOpen(true);
  }

  function closeColorModal() {
    setColorModalOpen(false);
    setColorForm(emptyColorForm());
    setColorFormErrors({});
  }

  function patchColorForm<K extends keyof ColorFormState>(key: K, value: ColorFormState[K]) {
    setColorForm((prev) => ({ ...prev, [key]: value }));
    setColorFormErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleColorImageFiles(files: File[] | FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files).filter(
      (file) =>
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif)$/i.test(file.name),
    );
    if (!selected.length) {
      toast("Please choose image files (JPEG, PNG, WebP, or GIF)", "error");
      return;
    }
    setColorUploading(true);
    setColorUploadProgress(`Uploading 0/${selected.length}`);
    try {
      const res = await uploadImages(selected, (done, total) => {
        setColorUploadProgress(`Uploading ${done}/${total}`);
      });
      const uploaded: ProductImage[] = (res.data || []).map((img: any, index: number) => ({
        id: img.publicId || `cimg-${Date.now()}-${index}`,
        url: img.url,
        alt: img.alt || colorForm.colorName || "Color variant image",
        isMain: false,
        sortOrder: index,
        publicId: img.publicId,
        width: img.width,
        height: img.height,
        format: img.format,
        bytes: img.bytes,
      }));
      if (!uploaded.length) {
        throw new Error("Upload did not return any images");
      }
      setColorForm((prev) => {
        const start = prev.images.length;
        const incoming = uploaded.map((img, index) => ({
          ...img,
          isMain: start === 0 && index === 0,
          sortOrder: start + index,
        }));
        const next = [...prev.images, ...incoming].map((img, sortOrder) => ({
          ...img,
          sortOrder,
        }));
        if (next.length && !next.some((img) => img.isMain)) {
          next[0] = { ...next[0], isMain: true };
        }
        return { ...prev, images: next };
      });
      const failedCount = res.failed?.length || 0;
      if (failedCount) {
        toast(`${uploaded.length} uploaded, ${failedCount} failed`, "error");
      } else {
        toast(
          uploaded.length === 1
            ? "Image uploaded successfully"
            : `${uploaded.length} images uploaded successfully`,
          "success",
        );
      }
    } catch (error: any) {
      toast(error?.message || "Image upload failed", "error");
    } finally {
      setColorUploading(false);
      setColorUploadProgress("");
    }
  }

  function removeColorImage(id: string) {
    const current = colorForm.images.find((img) => img.id === id);
    const publicId = current?.publicId;
    const next = colorForm.images.filter((img) => img.id !== id);
    if (next.length && !next.some((img) => img.isMain)) {
      next[0] = { ...next[0], isMain: true };
    }
    patchColorForm(
      "images",
      next.map((img, index) => ({ ...img, sortOrder: index })),
    );
    if (publicId) {
      void deleteImage(publicId).catch(() => {
        toast("Image removed from color. Storage cleanup failed.", "error");
      });
    }
  }

  function setColorMainImage(id: string) {
    const index = colorForm.images.findIndex((img) => img.id === id);
    if (index < 0) return;
    const next = [...colorForm.images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    patchColorForm(
      "images",
      next.map((img, sortOrder) => ({
        ...img,
        sortOrder,
        isMain: sortOrder === 0,
      })),
    );
  }

  function moveColorImage(id: string, direction: -1 | 1) {
    const index = colorForm.images.findIndex((img) => img.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= colorForm.images.length) return;
    const next = [...colorForm.images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    patchColorForm(
      "images",
      next.map((img, sortOrder) => ({
        ...img,
        sortOrder,
        isMain: sortOrder === 0,
      })),
    );
  }

  function validateColorForm(): boolean {
    const errors: Record<string, string> = {};
    const name = colorForm.colorName.trim();
    const code = colorForm.colorCode.trim();

    if (!name) {
      errors.colorName = "Color name is required";
    } else if (name.length > 60) {
      errors.colorName = "Color name must be 60 characters or less";
    }

    if (!code) {
      errors.colorCode = "Color code is required";
    } else if (!HEX_COLOR_REGEX.test(code)) {
      errors.colorCode = "Invalid color code. Use #RRGGBB or #RGB format";
    }

    const duplicate = values.colorVariants.find(
      (cv) => cv.colorName.toLowerCase() === name.toLowerCase() && cv.id !== colorForm.id,
    );
    if (duplicate) {
      errors.colorName = "A color with this name already exists for this product";
    }

    if (colorForm.images.length === 0) {
      errors.images = "At least one image is required for the color variation";
    }

    setColorFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function saveColorVariant() {
    if (!validateColorForm()) return;

    const colorName = colorForm.colorName.trim();
    const colorCode = colorForm.colorCode.trim().toUpperCase();
    const sortOrder = values.colorVariants.length;

    const existingIndex = values.colorVariants.findIndex((cv) => cv.id === colorForm.id);

    if (existingIndex >= 0) {
      const updated = [...values.colorVariants];
      updated[existingIndex] = {
        ...updated[existingIndex],
        colorName,
        colorCode,
        images: colorForm.images,
      };
      patch("colorVariants", updated);
      toast("Color updated successfully", "success");
    } else {
      const newVariant: ColorVariant = {
        id: colorForm.id,
        colorName,
        colorCode,
        sortOrder,
        images: colorForm.images,
      };
      patch("colorVariants", [...values.colorVariants, newVariant]);
      toast("Color added successfully", "success");
    }

    closeColorModal();
  }

  function removeColorVariant(id: string) {
    const cv = values.colorVariants.find((c) => c.id === id);
    if (!cv) return;
    cv.images.forEach((img) => {
      if (img.publicId) {
        void deleteImage(img.publicId).catch(() => undefined);
      }
    });
    patch(
      "colorVariants",
      values.colorVariants
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, sortOrder: i })),
    );
    toast("Color removed", "success");
  }

  async function handleSubmit(event: FormEvent, mode: "draft" | "publish") {
    event.preventDefault();
    if (submitting) return;

    if (!values.category.trim()) {
      toast(
        categories.length
          ? "Please select a category"
          : "Create a category first (Categories page), then add the product",
        "error",
      );
      return;
    }

    for (const cv of values.colorVariants) {
      if (!cv.colorName.trim()) {
        toast(`Color variation has no name. Please edit or remove it.`, "error");
        return;
      }
      if (!HEX_COLOR_REGEX.test(cv.colorCode)) {
        toast(`Color "${cv.colorName}" has invalid color code. Please edit it.`, "error");
        return;
      }
      if (cv.images.length === 0) {
        toast(`Color "${cv.colorName}" needs at least one image.`, "error");
        return;
      }
    }

    const names = values.colorVariants.map((cv) => cv.colorName.toLowerCase().trim());
    const unique = new Set(names);
    if (names.length !== unique.size) {
      toast("Duplicate color names found. Please make color names unique.", "error");
      return;
    }

    const status: ProductStatus =
      mode === "draft" ? "draft" : values.status === "inactive" ? "inactive" : "active";
    setSubmitting(true);
    try {
      await onSubmit({ ...values, category: values.category.trim(), status }, mode);
    } finally {
      setSubmitting(false);
    }
  }

  const mainImage =
    values.images.find((img) => img.isMain)?.url || values.images[0]?.url;

  return (
    <form onSubmit={(e) => void handleSubmit(e, "publish")}>
      <div className="grid-2">
        <div>
          <div className="section-card">
            <h3>1. Basic Information</h3>
            <div className="form-grid">
              <div className="full">
                <Input
                  label="Product Name"
                  value={values.name}
                  onChange={(e) => handleName(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Slug"
                value={values.slug}
                onChange={(e) => patch("slug", slugify(e.target.value))}
                required
              />
              <Select
                label="Category"
                value={values.category}
                onChange={(e) => patch("category", e.target.value)}
                options={categoryOptions}
                placeholder={
                  categoryOptions.length ? "Select category" : "No categories yet — create one first"
                }
                required
              />
              <Select
                label="Collection"
                value={values.collection}
                onChange={(e) => patch("collection", e.target.value)}
                options={COLLECTIONS.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Badge"
                value={values.badge || ""}
                onChange={(e) => patch("badge", e.target.value || null)}
                options={[
                  { value: "", label: "None" },
                  ...PRODUCT_BADGES.map((b) => ({ value: b, label: b })),
                ]}
              />
            </div>
          </div>

          <div className="section-card">
            <h3>2. Product Description</h3>
            <Textarea
              label="Description"
              value={values.description}
              onChange={(e) => patch("description", e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="section-card">
            <h3>3. Pricing</h3>
            <div className="form-grid">
              <Input
                label="Price"
                type="number"
                min={0}
                step="0.01"
                value={values.price}
                onChange={(e) => patch("price", Number(e.target.value))}
                required
              />
              <Input
                label="Sale Price"
                type="number"
                min={0}
                step="0.01"
                value={values.salePrice ?? ""}
                onChange={(e) =>
                  patch(
                    "salePrice",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="section-card">
            <h3>4. Inventory</h3>
            <div className="form-grid">
              <Input
                label="SKU"
                value={values.sku}
                onChange={(e) => patch("sku", e.target.value)}
                required
              />
              <Input
                label="Stock"
                type="number"
                min={0}
                value={values.stock}
                onChange={(e) => patch("stock", Number(e.target.value))}
              />
              <Select
                label="Status"
                value={values.status}
                onChange={(e) => patch("status", e.target.value as ProductStatus)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>
          </div>

          <div className="section-card">
            <h3>5. Product Media</h3>
            <div style={{ fontSize: 13, color: "var(--rnb-muted)", marginBottom: 14, lineHeight: 1.6 }}>
              <p>
                <strong style={{ color: "var(--rnb-text)" }}>Recommended size:</strong> 2000 × 2000 pixels (square, 1:1 ratio)
              </p>
              <p style={{ marginTop: 4 }}>
                Click <strong>Upload Images</strong> or drag &amp; drop. You can select multiple files at once (up to 24 images).
                Use <Star size={11} style={{ display: "inline", verticalAlign: "middle" }} /> to set the main image, ← → to reorder, and × to remove.
              </p>
            </div>
            <div
              className="media-grid"
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const dropped = Array.from(event.dataTransfer.files || []);
                void handleImageFiles(dropped);
              }}
            >
              {values.images.map((img) => (
                <div key={img.id} className="media-item">
                  <img src={img.url} alt={img.alt} loading="lazy" />
                  <button
                    type="button"
                    className="media-item__remove"
                    aria-label="Remove image"
                    title="Remove image"
                    onClick={() => removeImage(img.id)}
                  >
                    <X size={16} />
                  </button>
                  <div className="media-item__actions">
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      onClick={() => setMain(img.id)}
                      title={img.isMain ? "Main image" : "Set as main"}
                    >
                      <Star size={13} fill={img.isMain ? "#005afa" : "none"} />
                    </button>
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => moveImage(img.id, -1)} title="Move left">
                      ←
                    </button>
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => moveImage(img.id, 1)} title="Move right">
                      →
                    </button>
                  </div>
                  {img.isMain ? (
                    <span className="badge badge--blue" style={{ position: "absolute", top: 8, left: 8 }}>
                      Main
                    </span>
                  ) : null}
                  {(img.width || img.height) ? (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 50,
                        left: 8,
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(15,23,42,0.7)",
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    >
                      {img.width || "?"}×{img.height || "?"}
                    </span>
                  ) : null}
                </div>
              ))}
              <label className={uploadingImages ? "media-add media-add--disabled" : "media-add"}>
                <input
                  className="media-add__input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  disabled={uploadingImages}
                  onChange={(event) => {
                    const picked = event.currentTarget.files
                      ? Array.from(event.currentTarget.files)
                      : [];
                    event.currentTarget.value = "";
                    void handleImageFiles(picked);
                  }}
                />
                <Upload size={22} />
                <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center", padding: "0 10px" }}>
                  {uploadingImages ? uploadProgress || "Uploading..." : "Upload Images"}
                </span>
                <span className="image-dimensions-hint">
                  JPG, PNG, WebP, GIF<br />
                  2000×2000 recommended
                </span>
              </label>
            </div>
            {values.images.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: values.images.length >= 4 ? "var(--rnb-soft)" : "#fafbfc",
                  border: "1px solid var(--rnb-border)",
                  fontSize: 12,
                  color: "var(--rnb-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span>
                  <strong style={{ color: "var(--rnb-text)" }}>{values.images.length}</strong> image{values.images.length === 1 ? "" : "s"} added
                  {values.images.some((i) => i.isMain) ? " · main image set" : ""}
                </span>
                <span>First image is shown on product listings</span>
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                >
                  <Plus size={14} /> {uploadingVideo ? "Uploading video..." : "Upload Video"}
                </Button>
                {videoUrl(values.video) ? (
                  <Button type="button" variant="ghost" onClick={() => patch("video", null)}>
                    Remove video
                  </Button>
                ) : null}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                hidden
                onChange={(e) => void handleVideoFile(e.target.files)}
              />
              {videoUrl(values.video) ? (
                <p style={{ fontSize: 13, color: "var(--rnb-muted)", wordBreak: "break-all" }}>
                  Video: {videoUrl(values.video)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="section-card">
            <h3>6. Variations</h3>
            {values.variations.map((variation) => (
              <div key={variation.id} className="variation-block">
                <div className="form-grid">
                  <Input
                    label="Variation Name"
                    value={variation.name}
                    onChange={(e) => updateVariation(variation.id, { name: e.target.value })}
                  />
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                    <Input
                      label="Add value"
                      value={optionInput[variation.id] || ""}
                      onChange={(e) =>
                        setOptionInput((prev) => ({
                          ...prev,
                          [variation.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addVariationValue(variation.id);
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={() => addVariationValue(variation.id)}>
                      Add
                    </Button>
                    <Button type="button" variant="danger" onClick={() => removeVariation(variation.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="chip-row">
                  {variation.values.map((value) => (
                    <span key={value} className="chip">
                      {value}
                      <button
                        type="button"
                        onClick={() =>
                          updateVariation(variation.id, {
                            values: variation.values.filter((v) => v !== value),
                          })
                        }
                        style={{ border: 0, background: "transparent", cursor: "pointer" }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addVariation}>
              <Plus size={16} /> Add Variation
            </Button>

            <div style={{ marginTop: 16 }}>
              <div className="form-grid">
                <Input
                  label="Sizes"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  placeholder="e.g. Medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSize();
                    }
                  }}
                />
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <Button type="button" variant="secondary" onClick={addSize}>
                    Add Size
                  </Button>
                </div>
              </div>
              <div className="chip-row">
                {values.sizes.map((size) => (
                  <span key={size} className="chip">
                    {size}
                    <button
                      type="button"
                      onClick={() =>
                        patch(
                          "sizes",
                          values.sizes.filter((item) => item !== size),
                        )
                      }
                      style={{ border: 0, background: "transparent", cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 650 }}>
                  <Palette size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                  Color Variants
                </h4>
                <Button type="button" variant="secondary" onClick={openAddColorModal}>
                  <Plus size={14} /> Add Color
                </Button>
              </div>
              {values.colorVariants.length === 0 ? (
                <div
                  style={{
                    padding: "24px 16px",
                    border: "2px dashed var(--rnb-border)",
                    borderRadius: 10,
                    textAlign: "center",
                    color: "var(--rnb-muted)",
                    fontSize: 13,
                  }}
                >
                  No color variants yet. Click <strong style={{ color: "var(--rnb-text)" }}>Add Color</strong> to create a color variation with its own images.
                </div>
              ) : (
                <div className="color-variant-list">
                  {values.colorVariants.map((cv) => (
                    <div key={cv.id} className="color-variant-card">
                      <div className="color-variant-card__header">
                        <div className="color-variant-card__title">
                          <span
                            className="color-swatch"
                            style={{ background: cv.colorCode }}
                            title={cv.colorCode}
                          />
                          <div>
                            <strong>{cv.colorName}</strong>
                            <span style={{ fontSize: 12, color: "var(--rnb-muted)", display: "block" }}>
                              {cv.colorCode}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => openEditColorModal(cv)}
                          >
                            <Edit2 size={13} /> Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeColorVariant(cv.id)}
                          >
                            <Trash2 size={13} /> Remove
                          </Button>
                        </div>
                      </div>
                      <div className="color-variant-card__images">
                        {cv.images.length > 0 ? (
                          cv.images.slice(0, 5).map((img) => (
                            <div key={img.id} className="color-variant-card__img">
                              <img src={img.url} alt={img.alt} loading="lazy" />
                              {img.isMain ? (
                                <span className="badge badge--blue" style={{ position: "absolute", top: 4, left: 4, fontSize: 10, height: 20, padding: "0 7px" }}>
                                  Main
                                </span>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              gridColumn: "1 / -1",
                              padding: "16px",
                              textAlign: "center",
                              fontSize: 12,
                              color: "var(--rnb-muted)",
                              background: "var(--rnb-secondary)",
                              borderRadius: 8,
                            }}
                          >
                            No images
                          </div>
                        )}
                        {cv.images.length > 5 ? (
                          <div
                            className="color-variant-card__img"
                            style={{
                              background: "var(--rnb-secondary)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--rnb-muted)",
                            }}
                          >
                            +{cv.images.length - 5}
                          </div>
                        ) : null}
                      </div>
                      {cv.images.length > 0 && (
                        <div style={{ fontSize: 12, color: "var(--rnb-muted)", marginTop: 8 }}>
                          {cv.images.length} image{cv.images.length === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="section-card">
            <h3>7. Product Details</h3>
            <div className="form-grid">
              <Input
                label="Material"
                value={values.material}
                onChange={(e) => patch("material", e.target.value)}
              />
              <Input
                label="Warranty"
                value={values.warranty}
                onChange={(e) => patch("warranty", e.target.value)}
              />
              <div className="full">
                <Textarea
                  label="Care"
                  value={values.care}
                  onChange={(e) => patch("care", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="section-card" style={{ position: "sticky", top: 88 }}>
            <h3>8. Product Preview</h3>
            <div className="preview-card">
              <div className="preview-card__media">
                {mainImage ? (
                  <>
                    <img src={mainImage} alt="" />
                    <button
                      type="button"
                      className="media-item__remove"
                      aria-label="Remove preview image"
                      title="Remove image"
                      onClick={() => {
                        const main =
                          values.images.find((img) => img.isMain) || values.images[0];
                        if (main) removeImage(main.id);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div style={{ aspectRatio: 1, background: "var(--rnb-secondary)", display: "grid", placeItems: "center", color: "var(--rnb-muted)" }}>
                    No image
                  </div>
                )}
              </div>
              <div className="preview-card__body">
                {values.badge ? (
                  <span className="badge badge--sky" style={{ marginBottom: 8 }}>
                    {values.badge}
                  </span>
                ) : null}
                <h4>{values.name || "Product name"}</h4>
                <p style={{ fontSize: 12, color: "var(--rnb-muted)", marginBottom: 8 }}>
                  {values.category} · {values.collection}
                </p>
                <div className="price">
                  <strong>
                    {formatCurrency(values.salePrice ?? values.price ?? 0)}
                  </strong>
                  {values.salePrice != null ? <s>{formatCurrency(values.price)}</s> : null}
                </div>
                <p style={{ marginTop: 10, fontSize: 13, color: "var(--rnb-muted)", lineHeight: 1.5 }}>
                  {values.description || "Description preview appears here."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <Button type="submit" disabled={submitting || uploadingImages || uploadingVideo}>
                {submitting ? "Saving..." : submitLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={(e) => void handleSubmit(e as unknown as FormEvent, "draft")}
              >
                Save Draft
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={colorModalOpen}
        onClose={closeColorModal}
        title={colorForm.colorName ? `Edit Color: ${colorForm.colorName}` : "Add Color Variation"}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeColorModal}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveColorVariant}
              disabled={colorUploading}
            >
              {colorForm.colorName ? "Save Changes" : "Add Color"}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-grid">
            <Input
              label="Color Name"
              value={colorForm.colorName}
              onChange={(e) => patchColorForm("colorName", e.target.value)}
              placeholder="e.g. Navy Blue"
              error={colorFormErrors.colorName}
              required
            />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <Input
                label="Color Code"
                value={colorForm.colorCode}
                onChange={(e) => {
                  let val = e.target.value.trim();
                  if (val && !val.startsWith("#")) val = "#" + val;
                  patchColorForm("colorCode", val);
                }}
                placeholder="#RRGGBB"
                error={colorFormErrors.colorCode}
                required
                maxLength={7}
              />
              <label
                style={{
                  position: "relative",
                  width: 52,
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid var(--rnb-border)",
                  background: HEX_COLOR_REGEX.test(colorForm.colorCode) ? colorForm.colorCode : "#fff",
                  overflow: "hidden",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "inline-block",
                }}
                title="Pick a color"
              >
                <input
                  type="color"
                  value={HEX_COLOR_REGEX.test(colorForm.colorCode) ? colorForm.colorCode : "#3b82f6"}
                  onChange={(e) => patchColorForm("colorCode", e.target.value.toUpperCase())}
                  style={{
                    position: "absolute",
                    inset: -5,
                    width: "calc(100% + 10px)",
                    height: "calc(100% + 10px)",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="field-label" style={{ marginBottom: 0 }}>
                Color Images
                <span style={{ color: "var(--rnb-danger)" }}> *</span>
              </label>
              {colorForm.images.length > 0 && (
                <span style={{ fontSize: 12, color: "var(--rnb-muted)" }}>
                  {colorForm.images.length} image{colorForm.images.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {colorFormErrors.images && (
              <div style={{ fontSize: 12, color: "var(--rnb-danger)", marginBottom: 8 }}>
                {colorFormErrors.images}
              </div>
            )}
            <div
              className="media-grid"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const dropped = Array.from(event.dataTransfer.files || []);
                void handleColorImageFiles(dropped);
              }}
            >
              {colorForm.images.map((img) => (
                <div key={img.id} className="media-item">
                  <img src={img.url} alt={img.alt} loading="lazy" />
                  <button
                    type="button"
                    className="media-item__remove"
                    aria-label="Remove image"
                    title="Remove image"
                    onClick={() => removeColorImage(img.id)}
                  >
                    <X size={14} />
                  </button>
                  <div className="media-item__actions">
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      onClick={() => setColorMainImage(img.id)}
                      title={img.isMain ? "Main image" : "Set as main"}
                    >
                      <Star size={12} fill={img.isMain ? "#005afa" : "none"} />
                    </button>
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => moveColorImage(img.id, -1)} title="Move left">
                      ←
                    </button>
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => moveColorImage(img.id, 1)} title="Move right">
                      →
                    </button>
                  </div>
                  {img.isMain ? (
                    <span className="badge badge--blue" style={{ position: "absolute", top: 6, left: 6, fontSize: 10, height: 20, padding: "0 7px" }}>
                      Main
                    </span>
                  ) : null}
                </div>
              ))}
              <label className={colorUploading ? "media-add media-add--disabled" : "media-add"}>
                <input
                  ref={colorImageInputRef}
                  className="media-add__input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  disabled={colorUploading}
                  onChange={(event) => {
                    const picked = event.currentTarget.files
                      ? Array.from(event.currentTarget.files)
                      : [];
                    event.currentTarget.value = "";
                    void handleColorImageFiles(picked);
                  }}
                />
                <Upload size={18} />
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", padding: "0 8px" }}>
                  {colorUploading ? colorUploadProgress || "Uploading..." : "Upload Images"}
                </span>
              </label>
            </div>
            <div style={{ fontSize: 11, color: "var(--rnb-muted)", marginTop: 8, lineHeight: 1.5 }}>
              First image is the primary image for this color variant. Recommended: 2000 × 2000 px square (1:1 ratio).
            </div>
          </div>
        </div>
      </Modal>
    </form>
  );
}
