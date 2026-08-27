export type ValidationSeverity = "error" | "warning";
export type ValidationStatus = "valid" | "warning" | "invalid";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ValidationIssue {
  code: string;
  field: string;
  severity: ValidationSeverity;
  message: string;
}

export interface ProductValidationResult {
  product_id?: number | null;
  sku?: string | null;
  status: ValidationStatus;
  issues: ValidationIssue[];
}

export interface CatalogValidationResponse {
  upload_id: number;
  total_products: number;
  valid_products: number;
  warning_products: number;
  invalid_products: number;
  total_errors: number;
  total_warnings: number;
  health_score: number;
  results: ProductValidationResult[];
}

export interface CatalogUpload {
  upload_id: number;
  filename: string;
  file_type: string;
  total_products: number;
  status: string;
  created_at: string | null;
}

export interface UploadCatalogResponse {
  message: string;
  upload_id: number;
  filename: string;
  total_products: number;
  status: string;
}

export interface ReviewItem {
  product_id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  validation_status: ValidationStatus;
  review_status: ReviewStatus;
  issues: ValidationIssue[];
}

export interface ValidationRunMeta {
  id: number;
  created_at: string | null;
  health_score: number;
}

export interface ReviewDetails {
  product_id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  brand: string | null;
  price: number;
  currency: string;
  inventory: number;
  image_url: string | null;
  validation_status: ValidationStatus;
  review_status: ReviewStatus;
  issues: ValidationIssue[];
  latest_validation_run: ValidationRunMeta | null;
}

export interface ReviewDecisionResponse {
  product_id: number;
  review_status: ReviewStatus;
}

export interface ProductReviewStatusResponse {
  product_id: number;
  validation_status: ValidationStatus;
  review_status: ReviewStatus;
}

export interface AISuggestion {
  explanation: string;
  suggestion: string;
  confidence: "low" | "medium" | "high";
}

export interface TopIssue {
  code: string;
  count: number;
}

export interface StatusBreakdown {
  valid: number;
  warning: number;
  invalid: number;
}

export interface LatestValidationSummary {
  total_products: number;
  valid_products: number;
  warning_products: number;
  invalid_products: number;
  total_errors: number;
  total_warnings: number;
}

export interface AnalyticsSummary {
  total_catalogs: number;
  total_products: number;
  latest_health_score: number | null;
  latest_validation: LatestValidationSummary | null;
  status_breakdown: StatusBreakdown;
  top_issues: TopIssue[];
  products_requiring_review: number;
}

export interface HealthHistoryItem {
  validation_run_id: number;
  upload_id: number;
  health_score: number;
  created_at: string;
}

export interface HealthHistoryResponse {
  history: HealthHistoryItem[];
}
