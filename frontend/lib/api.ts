import {
  AISuggestion,
  AnalyticsSummary,
  CatalogUpload,
  CatalogValidationResponse,
  HealthHistoryResponse,
  ReviewDecisionResponse,
  ReviewDetails,
  ReviewItem,
  UploadCatalogResponse,
} from "@/types/catalog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface ErrorPayload {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // If body is not FormData, default content-type to application/json
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      `Unable to connect to backend server at ${API_BASE_URL}. Please ensure the service is running.`
    );
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    let errorData: ErrorPayload | null = null;
    try {
      errorData = (await response.json()) as ErrorPayload;
      if (errorData && typeof errorData.detail === "string") {
        errorDetail = errorData.detail;
      } else if (errorData && Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail
          .map((d) => d.msg || JSON.stringify(d))
          .join(", ");
      } else if (errorData && errorData.message) {
        errorDetail = errorData.message;
      }
    } catch {
      errorDetail =
        response.statusText || `Request failed with status ${response.status}`;
    }

    if (response.status === 404) {
      errorDetail = errorDetail || "Requested resource not found.";
    } else if (response.status === 400) {
      errorDetail = errorDetail || "Unable to process request with provided data.";
    } else if (response.status === 503) {
      errorDetail = errorDetail || "AI suggestion service is currently unavailable.";
    } else if (response.status >= 500) {
      errorDetail =
        errorDetail || "Something went wrong on the server. Please try again.";
    }

    throw new ApiError(response.status, errorDetail, errorData);
  }

  // Parse JSON response
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

/**
 * Upload a CSV or XLSX catalog file
 */
export async function uploadCatalog(file: File): Promise<UploadCatalogResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadCatalogResponse>("/api/v1/catalogs/upload", {
    method: "POST",
    body: formData,
  });
}

/**
 * Retrieve catalog upload history
 */
export async function getCatalogs(): Promise<CatalogUpload[]> {
  return request<CatalogUpload[]>("/api/v1/catalogs", {
    method: "GET",
  });
}

/**
 * Validate catalog by upload_id
 */
export async function validateCatalog(
  uploadId: number
): Promise<CatalogValidationResponse> {
  return request<CatalogValidationResponse>(
    `/api/v1/catalogs/${uploadId}/validate`,
    {
      method: "POST",
    }
  );
}

/**
 * Retrieve latest validation result for catalog upload
 */
export async function getValidationResult(
  uploadId: number
): Promise<CatalogValidationResponse> {
  return request<CatalogValidationResponse>(
    `/api/v1/catalogs/${uploadId}/validation`,
    {
      method: "GET",
    }
  );
}

/**
 * Retrieve products requiring review
 */
export async function getReviewQueue(): Promise<ReviewItem[]> {
  return request<ReviewItem[]>("/api/v1/reviews", {
    method: "GET",
  });
}

/**
 * Retrieve detailed product review information
 */
export async function getReviewDetails(
  productId: number
): Promise<ReviewDetails> {
  return request<ReviewDetails>(`/api/v1/reviews/${productId}`, {
    method: "GET",
  });
}

/**
 * Approve a product review status
 */
export async function approveProduct(
  productId: number
): Promise<ReviewDecisionResponse> {
  return request<ReviewDecisionResponse>(
    `/api/v1/reviews/${productId}/approve`,
    {
      method: "POST",
    }
  );
}

/**
 * Reject a product review status
 */
export async function rejectProduct(
  productId: number
): Promise<ReviewDecisionResponse> {
  return request<ReviewDecisionResponse>(
    `/api/v1/reviews/${productId}/reject`,
    {
      method: "POST",
    }
  );
}

/**
 * Retrieve AI validation suggestion for a specific issue on a product
 */
export async function getAISuggestion(
  productId: number,
  issueCode: string
): Promise<AISuggestion> {
  return request<AISuggestion>(
    `/api/v1/reviews/${productId}/issues/${encodeURIComponent(issueCode)}/suggestion`,
    {
      method: "POST",
    }
  );
}

/**
 * Retrieve analytics summary metrics
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>("/api/v1/analytics/summary", {
    method: "GET",
  });
}

/**
 * Retrieve health score history across validation runs
 */
export async function getHealthHistory(): Promise<HealthHistoryResponse> {
  return request<HealthHistoryResponse>("/api/v1/analytics/health-history", {
    method: "GET",
  });
}

/**
 * Check backend health status
 */
export async function getHealth(): Promise<{ status: string }> {
  return request<{ status: string }>("/health", {
    method: "GET",
  });
}
