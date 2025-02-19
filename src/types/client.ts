interface IPOC {
  name: string;
  email: string;
  phone: string;
  designation: string;
  opt_for_email_reminder: boolean;
}

export type ClientDetailsInputs = {
  parent_company?: {
    id: string;
    name: string;
    new?: boolean;
  };
  name: string;
  pan_number: string;
  gst_number: string;
  address: string;
  industry: string;
  remark?: string;
  amc_frequency_in_months: number;
  vendor_id?: string;
  client_id?: string;
  point_of_contacts: IPOC[];
};

export enum ORDER_STATUS_ENUM {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
