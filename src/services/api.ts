const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "rnb-admin-token";

export type ApiError = {
  message: string;
  status: number;
  errors?: unknown[];
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  query?: Record<string, string | number | undefined | null>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(
    path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`,
  );
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const auth = options.auth !== false;
  const token = getToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method || "GET",
    headers,
    body,
  });

  let payload: any = null;
  const text = await response.text();
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { success: false, message: text || "Invalid response" };
  }

  if (response.status === 401) {
    setToken(null);
    localStorage.removeItem("rnb-admin-auth");
    if (!window.location.pathname.includes("/login")) {
      window.location.assign("/login");
    }
  }

  if (!response.ok || payload?.success === false) {
    const error: ApiError = {
      message: payload?.message || `Request failed (${response.status})`,
      status: response.status,
      errors: payload?.errors || [],
    };
    throw error;
  }

  return payload as T;
}

export function apiGet<T>(path: string, query?: RequestOptions["query"]) {
  return apiRequest<T>(path, { method: "GET", query });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body });
}

export function apiPut<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PUT", body });
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PATCH", body });
}

export function apiDelete<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "DELETE", body });
}

export type UploadedImage = {
  url: string;
  publicId?: string;
  width?: number | null;
  height?: number | null;
  format?: string;
  bytes?: number;
  originalName?: string;
  mimeType?: string;
  alt?: string;
  isMain?: boolean;
  sortOrder?: number;
};

export type FailedImage = {
  originalName: string;
  reason: string;
};

const MAX_IMAGE_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;
const WEBP_QUALITY = 0.82;
const BATCH_SIZE = 2;

function isAnimatedGif(file: File): boolean {
  return file.type === "image/gif";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image: ${file.name}`));
    };
    img.src = url;
  });
}

async function resizeAndCompressImage(file: File): Promise<File> {
  if (isAnimatedGif(file)) {
    return file;
  }

  const maxBytes = 20 * 1024 * 1024;
  if (file.size <= maxBytes && file.type === "image/gif") {
    return file;
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const objectUrl = img.src;
  try {
    const { naturalWidth, naturalHeight } = img;

    let targetWidth = naturalWidth;
    let targetHeight = naturalHeight;

    if (naturalWidth > MAX_IMAGE_DIMENSION || naturalHeight > MAX_IMAGE_DIMENSION) {
      const ratio = Math.min(
        MAX_IMAGE_DIMENSION / naturalWidth,
        MAX_IMAGE_DIMENSION / naturalHeight,
      );
      targetWidth = Math.max(1, Math.round(naturalWidth * ratio));
      targetHeight = Math.max(1, Math.round(naturalHeight * ratio));
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (file.type === "image/png") {
      ctx.clearRect(0, 0, targetWidth, targetHeight);
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    let outputType = file.type;
    let quality: number | undefined;
    let fileExt = file.name.split(".").pop() || "";

    if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/pjpeg") {
      outputType = "image/jpeg";
      quality = JPEG_QUALITY;
      fileExt = "jpg";
    } else if (file.type === "image/webp") {
      outputType = "image/webp";
      quality = WEBP_QUALITY;
      fileExt = "webp";
    } else if (file.type === "image/png") {
      outputType = "image/png";
      quality = undefined;
      fileExt = "png";
    } else {
      outputType = "image/jpeg";
      quality = JPEG_QUALITY;
      fileExt = "jpg";
    }

    const blob: Blob = await new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas produced no output"));
          },
          outputType,
          quality,
        );
      } catch (e) {
        reject(e);
      }
    });

    if (blob.size > file.size && file.size <= maxBytes) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    const newName = `${baseName}.${fileExt}`;
    return new File([blob], newName, { type: outputType, lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function uploadedImageList(payload: any): UploadedImage[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === "object" && payload.data.url) {
    return [payload.data];
  }
  if (Array.isArray(payload?.images)) return payload.images;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.images)) return payload.data.images;
  return [];
}

async function uploadSingleBatch(
  batch: File[],
): Promise<{ uploaded: UploadedImage[]; failed: FailedImage[] }> {
  const formData = new FormData();
  batch.forEach((file) => {
    formData.append("images", file);
  });

  try {
    const res = await apiRequest<{
      success: true;
      data: UploadedImage[] | UploadedImage;
      images?: UploadedImage[];
      count?: number;
    }>("/uploads/images", {
      method: "POST",
      formData,
    });
    const uploaded = uploadedImageList(res);
    const batchNames = new Set(batch.map((f) => f.name));
    const uploadedNames = new Set(uploaded.map((u) => u.originalName || ""));
    const failed: FailedImage[] = batch
      .filter((f) => !uploadedNames.has(f.name))
      .map((f) => ({
        originalName: f.name,
        reason: "Not returned by server",
      }))
      .filter((f) => batchNames.has(f.originalName));
    return { uploaded, failed };
  } catch (error: any) {
    const msg = error?.message || "Upload failed";
    const failed: FailedImage[] = batch.map((f) => ({
      originalName: f.name,
      reason: msg,
    }));
    return { uploaded: [], failed };
  }
}

export async function uploadImages(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<{
  success: true;
  data: UploadedImage[];
  count: number;
  images: UploadedImage[];
  failed: FailedImage[];
}> {
  const selected = files.filter((file) => file && file.size > 0);
  if (!selected.length) {
    const error: ApiError = {
      message: "No images selected",
      status: 400,
      errors: [],
    };
    throw error;
  }

  onProgress?.(0, selected.length);

  const processed: (File | null)[] = [];
  const processedFailures: FailedImage[] = [];

  for (let i = 0; i < selected.length; i++) {
    const file = selected[i];
    try {
      const resized = await resizeAndCompressImage(file);
      processed.push(resized);
    } catch (e: any) {
      processedFailures.push({
        originalName: file.name,
        reason: e?.message || "Failed to process image",
      });
      processed.push(null);
    }
  }

  const validProcessed = processed.filter((f): f is File => f !== null);

  let doneSoFar = processedFailures.length;
  onProgress?.(doneSoFar, selected.length);

  const allUploaded: UploadedImage[] = [];
  const allFailed: FailedImage[] = [...processedFailures];

  if (validProcessed.length > 0) {
    for (let i = 0; i < validProcessed.length; i += BATCH_SIZE) {
      const batch = validProcessed.slice(i, i + BATCH_SIZE);
      const { uploaded, failed } = await uploadSingleBatch(batch);
      allUploaded.push(...uploaded);
      allFailed.push(...failed);
      doneSoFar += batch.length;
      onProgress?.(Math.min(doneSoFar, selected.length), selected.length);
    }
  }

  if (!allUploaded.length && allFailed.length > 0) {
    const firstReason = allFailed[0]?.reason || "";
    const error: ApiError = {
      message:
        allFailed.length === selected.length
          ? `All ${allFailed.length} image${allFailed.length === 1 ? "" : "s"} failed to upload. ${firstReason ? `First error: ${firstReason}. ` : ""}Try smaller JPEG/PNG/WebP files under 20MB.`
          : firstReason || "Upload failed",
      status: 413,
      errors: allFailed.map((f) => `${f.originalName}: ${f.reason}`),
    };
    throw error;
  }

  onProgress?.(selected.length, selected.length);

  return {
    success: true as const,
    data: allUploaded,
    count: allUploaded.length,
    images: allUploaded,
    failed: allFailed,
  };
}

export async function deleteImage(publicId: string) {
  return apiRequest<{ success: true; data: { publicId: string } }>("/uploads/images", {
    method: "DELETE",
    body: { publicId },
  });
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append("video", file);
  return apiRequest<{ success: true; data: any }>("/uploads/videos", {
    method: "POST",
    formData,
  });
}
