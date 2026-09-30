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

export type ImageState = "waiting" | "processing" | "uploading" | "done" | "failed";

export type QueuedImage = {
  id: string;
  originalName: string;
  state: ImageState;
  progressPct: number;
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  result?: UploadedImage;
};

export type UploadProgressListener = (info: {
  completed: number;
  total: number;
  queued: QueuedImage[];
  uploaded: UploadedImage[];
  failed: FailedImage[];
}) => void;

const MAX_IMAGE_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;
const WEBP_QUALITY = 0.82;
const MAX_CONCURRENT_UPLOADS = 4;
const PRESIGN_BATCH = 50;

type PresignItemRequest = {
  fileName: string;
  contentType: string;
  size: number;
  kind?: "image" | "video";
};

type PresignedUploadItem = {
  objectKey: string;
  publicUrl: string;
  uploadUrl: string;
  contentType: string;
  fileName?: string;
  size: number | null;
  kind: "image" | "video";
  expiresIn: number;
};

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

async function resizeAndCompressImage(file: File): Promise<{
  file: File;
  width: number | null;
  height: number | null;
}> {
  let naturalW: number | null = null;
  let naturalH: number | null = null;

  if (isAnimatedGif(file)) {
    return { file, width: null, height: null };
  }

  const maxBytes = 20 * 1024 * 1024;
  if (file.size <= maxBytes && file.type === "image/gif") {
    return { file, width: null, height: null };
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { file, width: null, height: null };
  }

  const objectUrl = img.src;
  try {
    const { naturalWidth, naturalHeight } = img;
    naturalW = naturalWidth;
    naturalH = naturalHeight;

    let targetWidth = naturalWidth;
    let targetHeight = naturalHeight;

    if (naturalWidth > MAX_IMAGE_DIMENSION || naturalHeight > MAX_IMAGE_DIMENSION) {
      const ratio = Math.min(
        MAX_IMAGE_DIMENSION / naturalWidth,
        MAX_IMAGE_DIMENSION / naturalHeight,
      );
      targetWidth = Math.max(1, Math.round(naturalWidth * ratio));
      targetHeight = Math.max(1, Math.round(naturalHeight * ratio));
      naturalW = targetWidth;
      naturalH = targetHeight;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, width: naturalW, height: naturalH };

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
      return { file, width: naturalWidth, height: naturalHeight };
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    const newName = `${baseName}.${fileExt}`;
    const finalFile = new File([blob], newName, { type: outputType, lastModified: Date.now() });
    return { file: finalFile, width: naturalW, height: naturalH };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function presignBatch(items: PresignItemRequest[]): Promise<PresignedUploadItem[]> {
  const res = await apiRequest<{
    success: true;
    data: PresignedUploadItem[] | PresignedUploadItem;
    count?: number;
  }>("/uploads/presign", {
    method: "POST",
    body: items,
  });
  if (Array.isArray(res?.data)) return res.data;
  if (res?.data && typeof res.data === "object" && (res.data as PresignedUploadItem).uploadUrl) {
    return [res.data as PresignedUploadItem];
  }
  throw new Error("Presign response missing uploadUrl entries");
}

async function uploadDirectToR2(
  presigned: PresignedUploadItem,
  blob: Blob,
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ ok: boolean; status: number; eTag?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", presigned.contentType || blob.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      const status = xhr.status;
      const ok = status >= 200 && status < 300;
      const eTag = xhr.getResponseHeader("ETag") || undefined;
      resolve({ ok, status, eTag });
    };

    xhr.onerror = () => {
      resolve({ ok: false, status: 0 });
    };

    xhr.onabort = () => {
      resolve({ ok: false, status: 0 });
    };

    xhr.ontimeout = () => {
      resolve({ ok: false, status: 408 });
    };

    try {
      xhr.send(blob);
    } catch {
      resolve({ ok: false, status: 0 });
    }
  });
}

type QueueEntry = {
  id: string;
  originalFile: File;
  processed:
    | { status: "pending" }
    | { status: "ready"; file: File; width: number | null; height: number | null; presigned?: PresignedUploadItem }
    | { status: "failed"; reason: string };
};

export async function uploadImages(
  files: File[],
  onProgress?: UploadProgressListener | ((done: number, total: number) => void),
): Promise<{
  success: true;
  data: UploadedImage[];
  count: number;
  images: UploadedImage[];
  failed: FailedImage[];
  queued: QueuedImage[];
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

  const entries: QueueEntry[] = selected.map((f, i) => ({
    id: `q-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    originalFile: f,
    processed: { status: "pending" },
  }));

  const queued: QueuedImage[] = entries.map((e) => ({
    id: e.id,
    originalName: e.originalFile.name,
    state: "waiting",
    progressPct: 0,
    uploadedBytes: 0,
    totalBytes: e.originalFile.size,
  }));

  const emitQueuedProgress = (
    uploadedCount: number,
    failedCount: number,
    results: UploadedImage[],
    fails: FailedImage[],
  ) => {
    if (typeof onProgress !== "function") return;
    if (onProgress.length === 2) {
      (onProgress as (done: number, total: number) => void)(
        uploadedCount + failedCount,
        selected.length,
      );
      return;
    }
    (onProgress as UploadProgressListener)({
      completed: uploadedCount + failedCount,
      total: selected.length,
      queued: queued.map((q) => ({ ...q })),
      uploaded: results,
      failed: fails,
    });
  };

  emitQueuedProgress(0, 0, [], []);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const q = queued[i];
    q.state = "processing";
    emitQueuedProgress(0, 0, [], []);
    try {
      const res = await resizeAndCompressImage(entry.originalFile);
      entry.processed = {
        status: "ready",
        file: res.file,
        width: res.width,
        height: res.height,
      };
      q.totalBytes = res.file.size || entry.originalFile.size;
      q.state = "waiting";
    } catch (err: any) {
      entry.processed = {
        status: "failed",
        reason: err?.message || "Failed to process image",
      };
      q.state = "failed";
      q.error = entry.processed.reason;
    }
  }

  const readyEntries = entries.filter(
    (e): e is QueueEntry & { processed: { status: "ready"; file: File; width: number | null; height: number | null } } =>
      e.processed.status === "ready",
  );

  const presignReqs: PresignItemRequest[] = readyEntries.map((e) => ({
    fileName: e.processed.file.name,
    contentType: e.processed.file.type || "image/jpeg",
    size: e.processed.file.size,
    kind: "image",
  }));

  const presignedMap = new Map<string, PresignedUploadItem>();

  if (readyEntries.length > 0) {
    for (let i = 0; i < presignReqs.length; i += PRESIGN_BATCH) {
      const slice = presignReqs.slice(i, i + PRESIGN_BATCH);
      try {
        const signed = await presignBatch(slice);
        signed.forEach((s, idx) => {
          const parentIdx = i + idx;
          const entry = readyEntries[parentIdx];
          if (!entry) return;
          entry.processed.presigned = s;
          presignedMap.set(entry.id, s);
        });
      } catch (err: any) {
        const msg: string = err?.message || "Failed to obtain upload authorization";
        for (let j = i; j < Math.min(i + PRESIGN_BATCH, presignReqs.length); j++) {
          const readyEntry = readyEntries[j];
          if (!readyEntry) continue;
          const entry = entries.find((ent) => ent.id === readyEntry.id);
          if (!entry) continue;
          entry.processed = { status: "failed", reason: msg };
          const q = queued.find((qq) => qq.id === entry.id);
          if (q) {
            q.state = "failed";
            q.error = msg;
          }
        }
      }
    }
  }

  const allResults: UploadedImage[] = [];
  const allFails: FailedImage[] = entries
    .filter((e) => e.processed.status === "failed")
    .map((e) => ({
      originalName: e.originalFile.name,
      reason: (e.processed as { status: "failed"; reason: string }).reason,
    }));

  let doneUploaded = entries.length - readyEntries.length + allFails.filter((f) => f.originalName && readyEntries.some(r => r.originalFile.name === f.originalName) ? 0 : 0).length;
  doneUploaded = entries.length - readyEntries.length;

  const uploadQueue = readyEntries.filter((e) => e.processed.presigned);
  let cursor = 0;

  const runOne = async (): Promise<void> => {
    while (cursor < uploadQueue.length) {
      const myIdx = cursor++;
      const entry = uploadQueue[myIdx];
      const processed = entry.processed as {
        status: "ready";
        file: File;
        width: number | null;
        height: number | null;
        presigned: PresignedUploadItem;
      };
      const q = queued.find((qq) => qq.id === entry.id)!;
      const signed = processed.presigned;

      q.state = "uploading";
      q.progressPct = 0;
      emitQueuedProgress(doneUploaded, entries.length, allResults, allFails);

      try {
        const put = await uploadDirectToR2(
          signed,
          processed.file,
          (uploaded, total) => {
            q.uploadedBytes = uploaded;
            q.totalBytes = total || q.totalBytes;
            q.progressPct = total ? Math.min(100, Math.round((uploaded / total) * 100)) : q.progressPct;
            emitQueuedProgress(doneUploaded, entries.length, allResults, allFails);
          },
        );

        if (put.ok) {
          const ext = signed.objectKey.split(".").pop()?.toLowerCase() || "";
          const result: UploadedImage = {
            url: signed.publicUrl,
            publicId: signed.objectKey,
            originalName: entry.originalFile.name,
            mimeType: signed.contentType,
            format: ext,
            bytes: processed.file.size,
            width: processed.width,
            height: processed.height,
            alt: "",
          };
          q.state = "done";
          q.progressPct = 100;
          q.uploadedBytes = q.totalBytes;
          q.result = result;
          allResults.push(result);
        } else {
          const reason =
            put.status === 403
              ? "Upload authorization expired (403)"
              : put.status === 0
                ? "Network error"
                : put.status === 408
                  ? "Request timed out"
                  : `R2 upload failed (HTTP ${put.status})`;
          q.state = "failed";
          q.error = reason;
          allFails.push({ originalName: entry.originalFile.name, reason });
        }
      } catch (e: any) {
        const reason = e?.message || "Upload error";
        q.state = "failed";
        q.error = reason;
        allFails.push({ originalName: entry.originalFile.name, reason });
      } finally {
        doneUploaded += 1;
        emitQueuedProgress(doneUploaded, entries.length, allResults, allFails);
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_UPLOADS, Math.max(1, uploadQueue.length)) },
    () => runOne(),
  );
  await Promise.all(workers);

  if (!allResults.length && allFails.length > 0) {
    const firstReason = allFails[0]?.reason || "";
    const error: ApiError = {
      message:
        allFails.length === selected.length
          ? `All ${allFails.length} image${allFails.length === 1 ? "" : "s"} failed to upload. ${firstReason ? `First error: ${firstReason}. ` : ""}Check your connection and try again.`
          : firstReason || "Upload failed",
      status: 413,
      errors: allFails.map((f) => `${f.originalName}: ${f.reason}`),
    };
    throw error;
  }

  emitQueuedProgress(entries.length, entries.length, allResults, allFails);

  return {
    success: true as const,
    data: allResults,
    count: allResults.length,
    images: allResults,
    failed: allFails,
    queued,
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
