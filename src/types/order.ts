import { PAYMENT_STATUS_ENUM } from "@/redux/api/order";
import { ORDER_STATUS_ENUM } from "./client";

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
  purchase_order_document?: string;
  purchase_order_number?: string;
  purchased_date: Date;
  base_cost_seperation?: {
    product_id: string;
    amount: number;
    percentage: number;
  }[];
  other_documents: {
    title: string;
    url: string;
  }[];
  amc_start_date?: Date;
  customization: CustomizationDetails;
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
