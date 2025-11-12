import { ORDER_STATUS_ENUM } from "./client";
import { IClientDataObject } from "@/redux/api/client";
import { IProduct } from "@/types/product";

export type IAMCFrequency = 1 | 3 | 6 | 12 | 18 | 24;

export type CreateOrderRequest = OrderDetailInputs & { client_id: string };

export interface ILicenceObject {
  rate: {
    percentage: number;
    amount: number;
  };
  _id: string;
  product_id: string;
  total_license: number;
  purchase_date: string;
  purchase_order_document: string;
  purchase_order_number: string;
  payment_receive_date?: Date;
  payment_status?: PAYMENT_STATUS_ENUM;
  invoice_document: string;
  invoice_number: string;
  invoice_date: Date;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomizationObject {
  _id: string;
  product_id: string;
  cost: number;
  modules: string[];
  reports: string[];
  payment_receive_date?: Date;
  payment_status?: PAYMENT_STATUS_ENUM;
  purchase_order_document: string;
  purchase_order_number: string;
  purchased_date: string;
  invoice_document: string;
  invoice_number: string;
  invoice_date: Date;
  type: CustomizationType;
  title?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAdditionalServiceObject {
  _id: string;
  product_id: string;
  name: string;
  date: {
    start: Date;
    end: Date;
  };
  cost: number;
  purchase_order_document?: string;
  purchase_order_number: string;
  payment_receive_date?: Date;
  payment_status?: PAYMENT_STATUS_ENUM;
  invoice_document?: string;
  invoice_number: string;
  invoice_date: Date;
  service_document?: string;
  order_id: string;
}

export interface IOrderObject<P = string> {
  products: P[];
  base_cost: number;
  amc_rate: {
    percentage: number;
    amount: number;
  };
  amc_rate_history: {
    percentage: number;
    amount: number;
    date: Date;
  }[];
  status: string;
  status_logs?: {
    from: ORDER_STATUS_ENUM;
    to: ORDER_STATUS_ENUM;
    date: Date;
    user: string;
  }[];
  amc_start_logs?: {
    from: Date;
    to: Date;
    date: Date;
    user: string;
  }[];
  payment_terms: {
    name: string;
    percentage_from_base_cost: number;
    calculated_amount: number;
    invoice_document: string;
    invoice_number?: string;
    invoice_date?: Date;
    payment_receive_date?: Date;
    status?: PAYMENT_STATUS_ENUM;
  }[];
  agreements: {
    start: Date;
    end: Date;
    document: string;
  }[];
  amc_amount?: number;
  purchase_order_document: string;
  purchase_order_number?: string;
  cost_per_license: number;
  licenses_with_base_price: number;
  training_and_implementation_cost?: number;
  amc_rate_change_frequency_in_years?: number;
  base_cost_seperation?: {
    product_id: string;
    amount: number;
    percentage: number;
  }[];
  other_documents: {
    title: string;
    url: string;
  }[];
  amc_start_date: string;
  purchased_date: Date;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  customizations?: ICustomizationObject[];
  licenses?: ILicenceObject[];
  is_purchased_with_order: {
    customization: boolean;
    license: boolean;
  };
  additional_services?: IAdditionalServiceObject[];
  _id: string;
}

export type TransformedAMCObject = Omit<IAMCObject, "order_id"> & {
  order: IOrderObject;
  _id: string;
};

export enum PAYMENT_STATUS_ENUM {
  PENDING = "pending",
  proforma = "proforma",
  INVOICE = "invoice",
  PAID = "paid",
}

export interface IAMCPayment {
  _id?: string;
  from_date: Date;
  to_date: Date;
  status: PAYMENT_STATUS_ENUM;
  proforma_date?: Date;
  received_date: Date;
  purchase_order_number: string;
  purchase_order_document: string;
  invoice_number: string;
  invoice_date?: Date;
  invoice_document?: string;
  amc_rate_applied?: number;
  amc_rate_amount?: number;
  total_cost?: number;
}

export interface IAMCObject {
  _id?: string;
  order_id: string;
  client: IClientDataObject;
  total_cost: number;
  amc_frequency_in_months: IAMCFrequency;
  last_payment?: IAMCPayment;
  amount: number;
  start_date: Date;
  amc_start_logs?: {
    from: Date;
    to: Date;
    date: Date;
    user: string;
  }[];
  products: IProduct[];
  payments?: IAMCPayment[];
  createdAt?: string;
  updatedAt?: string;
}

export type IUpdateOrderRequest = OrderDetailInputs & { orderId: string };

export enum PURCHASE_TYPE {
  CUSTOMIZATION = "customization",
  LICENSE = "license",
  ADDITIONAL_SERVICE = "additional_service",
  ORDER = "order",
}

export type IPendingPaymentType =
  | "amc"
  | "order"
  | "license"
  | "customization"
  | "additional_service";

export interface IPendingPayment {
  _id: string;
  type: IPendingPaymentType;
  status: PAYMENT_STATUS_ENUM;
  pending_amount: number;
  payment_identifier?: string | number;
  name: string;
  payment_date: string;
  client_name: string;
  product_name: string;
  [key: string]: any;
}

export interface IPendingPaymentPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IPendingPaymentResponse {
  pending_payments: IPendingPayment[];
  pagination: IPendingPaymentPagination;
}

export interface IUpdatePendingPaymentRequest {
  _id: string;
  type: IPendingPaymentType;
  payment_identifier: string | number;
  status: string;
  payment_receive_date: Date;
}

export interface IPurchase extends IOrderObject<IProduct> {
  client_id: IClientDataObject & {
    parent_company?: IClientDataObject;
  };
}

export interface IPaymentTerm {
  name: string;
  percentage_from_base_cost: number;
  calculated_amount: number;
  invoice_document: string; // cdn url
  invoice_number?: string;
  invoice_date?: Date;
  payment_receive_date?: Date;
  status?: PAYMENT_STATUS_ENUM;
}

export interface OrderDetailInputs {
  products: string[];
  base_cost: number;
  total_cost?: number;
  amc_rate: {
    percentage: number;
    amount: number;
  };
  status: ORDER_STATUS_ENUM;
  payment_terms: IPaymentTerm[];
  license?: string;
  agreements: {
    start: Date;
    end: Date;
    document: string;
  }[];
  status_logs?: {
    from: ORDER_STATUS_ENUM;
    to: ORDER_STATUS_ENUM;
    date: Date;
    user: string;
  }[];
  purchase_order_document?: string;
  purchase_order_number?: string;
  purchased_date: Date;
  training_and_implementation_cost?: number;
  amc_rate_change_frequency_in_years?: number;
  base_cost_seperation?: {
    product_id: string;
    amount: number;
    percentage: number;
  }[];
  amc_rate_history: {
    percentage: number;
    amount: number;
    date: Date;
  }[];
  other_documents: {
    title: string;
    url: string;
  }[];
  amc_start_date?: Date;
  amc_start_logs?: {
    from: Date;
    to: Date;
    date: Date;
    user: string;
  }[];
}

export interface LicenseDetails {
  cost_per_license: number;
  licenses_with_base_price: number;
}

export enum CustomizationType {
  MODULE = "module",
  REPORT = "report",
}

export interface CustomizationDetails {
  cost: number;
  modules: string[];
  reports?: string[];
  purchased_date?: Date;
  purchase_order_document?: string;
  payment_receive_date?: Date;
  payment_status?: PAYMENT_STATUS_ENUM;
  type?: CustomizationType;
}

export interface IAMCPaymentReview {
  from_date: Date;
  to_date: Date;
  status: PAYMENT_STATUS_ENUM;
  amc_rate_applied: number;
  amc_rate_amount: number;
  amc_frequency: number;
  total_cost: number;
}

export interface IFilteredClient {
  _id: string;
  name: string;
}

export interface IOrderFilterCompanyResponse {
  parents: IFilteredClient[];
  clients: IFilteredClient[];
}

export interface OrderFilterOptions {
  parentCompanyId?: string;
  clientId?: string;
  clientName?: string;
  productId?: string;
  status?: ORDER_STATUS_ENUM;
  startDate?: string;
  endDate?: string;
}
