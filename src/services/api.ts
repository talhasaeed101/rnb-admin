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

export async function uploadImages(
  files: File[],
  onProgress?: (done: number, total: number) => void,
) {
  const selected = files.filter((file) => file && file.size > 0);
  if (!selected.length) {
    const error: ApiError = {
      message: "No images selected",
      status: 400,
      errors: [],
    };
    throw error;
  }

  const formData = new FormData();
  selected.forEach((file) => {
    formData.append("images", file);
  });

  onProgress?.(0, selected.length);

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

    const data = uploadedImageList(res);
    onProgress?.(selected.length, selected.length);

    if (!data.length) {
      const error: ApiError = {
        message: "Image upload failed. Try smaller JPEG/PNG/WebP files.",
        status: 400,
        errors: [],
      };
      throw error;
    }

    return {
      success: true as const,
      data,
      count: data.length,
      images: data,
      failed: [],
    };
  } catch (error: any) {
    onProgress?.(0, selected.length);
    const errorObj: ApiError = {
      message:
        error?.message ||
        "Image upload failed. Try smaller JPEG/PNG/WebP files (recommended 2000x2000px).",
      status: error?.status || 400,
      errors: error?.errors || selected.map((f) => f.name),
    };
    throw errorObj;
  }
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
