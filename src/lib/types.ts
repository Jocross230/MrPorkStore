// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  email: string;
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSetting {
  id: string;
  whatsappNumber: string;
  businessName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  productType: string;
  weightOrSize: string | null;
  price: number;
  stockQuantity: number | null;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  weightOrSize: string | null;
  price: number;
  stockQuantity: number | null;
  isAvailable: boolean;
  displayOrder: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  publicId?: string | null;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}


// ─── Orders ──────────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  customerName: string;
  phoneNumber: string;
  email?: string;
  deliveryAddress?: string;
  items: CreateOrderItem[];
}

export interface CreateOrderItem {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  deliveryAddress: string | null;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId: string | null;
  productName: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = "NEW" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED";

// ─── Pig Submissions ──────────────────────────────────────────────────────────

export interface CreatePigSubmissionRequest {
  farmerName: string;
  phoneNumber: string;
  email?: string | null;
  location?: string | null;
  pigDetails?: string | null;
  weight?: number | null;
  expectedPrice?: number | null;
}

export interface PigSubmission {
  id: string;
  farmerName: string;
  phoneNumber: string;
  email: string | null;
  location: string | null;
  pigDetails: string | null;
  weight: number | null;
  expectedPrice: number | null;
  status: PigSubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PigSubmissionImage {
  id: string;
  pigSubmissionId: string;
  imageUrl: string;
  publicId?: string | null;
  createdAt: string;
}

export type PigSubmissionStatus = "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";

// ─── Data Networks & Plans ────────────────────────────────────────────────────

export interface DataNetwork {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataPlan {
  id: string;
  networkId: string;
  networkName: string;
  networkLogoUrl: string | null;
  name: string;
  dataSize: string;
  validity: string | null;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
