import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Trash2, Star, Upload } from "lucide-react";
import type { Product, ProductImage, ProductVariation, ProductStatus } from "@/types";
import { COLLECTIONS, PRODUCT_BADGES } from "@/data/products";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { uploadImages, uploadVideo } from "@/services/api";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { slugify } from "@/utils/format";

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
  };
}

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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
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
        }
      : {
          ...emptyValues(),
          category: categories[0]?.name || "",
        },
  );
  const [sizeInput, setSizeInput] = useState("");
  const [optionInput, setOptionInput] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleImageFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const res = await uploadImages(Array.from(files));
      const uploaded: ProductImage[] = (res.data || []).map((img: any, index: number) => ({
        id: img.publicId || `img-${Date.now()}-${index}`,
        url: img.url,
        alt: values.name || "Product image",
        isMain: values.images.length === 0 && index === 0,
        sortOrder: values.images.length + index,
        publicId: img.publicId,
        width: img.width,
        height: img.height,
        format: img.format,
        bytes: img.bytes,
      }));
      const next = [...values.images, ...uploaded].map((img, sortOrder) => ({
        ...img,
        sortOrder,
        isMain: sortOrder === 0 ? true : img.isMain && sortOrder !== 0 ? false : img.isMain,
      }));
      if (next.length && !next.some((img) => img.isMain)) {
        next[0] = { ...next[0], isMain: true };
      }
      // Ensure first image stays main if we had empty gallery
      if (values.images.length === 0 && next.length) {
        patch(
          "images",
          next.map((img, i) => ({ ...img, isMain: i === 0, sortOrder: i })),
        );
      } else {
        patch("images", next);
      }
      toast("Image uploaded successfully", "success");
    } catch (error: any) {
      toast(error?.message || "Image upload failed", "error");
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
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
    const next = values.images.filter((img) => img.id !== id);
    if (next.length && !next.some((img) => img.isMain)) {
      next[0] = { ...next[0], isMain: true };
    }
    patch(
      "images",
      next.map((img, index) => ({ ...img, sortOrder: index })),
    );
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
            <p style={{ fontSize: 13, color: "var(--rnb-muted)", marginBottom: 12 }}>
              Upload images/videos via the API (Cloudinary). First image is the main product image.
            </p>
            <div className="media-grid">
              {values.images.map((img) => (
                <div key={img.id} className="media-item">
                  <img src={img.url} alt={img.alt} />
                  <div className="media-item__actions">
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => setMain(img.id)}>
                      <Star size={12} />
                    </button>
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => moveImage(img.id, -1)}>
                      ←
                    </button>
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => moveImage(img.id, 1)}>
                      →
                    </button>
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => removeImage(img.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {img.isMain ? (
                    <span className="badge badge--blue" style={{ position: "absolute", top: 6, left: 6 }}>
                      Main
                    </span>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                className="media-add"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImages}
              >
                <Upload size={18} />
                <span style={{ fontSize: 11 }}>{uploadingImages ? "Uploading..." : "Upload"}</span>
              </button>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => void handleImageFiles(e.target.files)}
            />
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
              {mainImage ? (
                <img src={mainImage} alt="" />
              ) : (
                <div style={{ aspectRatio: 1, background: "var(--rnb-secondary)", display: "grid", placeItems: "center", color: "var(--rnb-muted)" }}>
                  No image
                </div>
              )}
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
                    ${((values.salePrice ?? values.price) || 0).toFixed(2)}
                  </strong>
                  {values.salePrice != null ? <s>${values.price.toFixed(2)}</s> : null}
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
    </form>
  );
}
