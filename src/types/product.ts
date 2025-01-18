export interface IProductModule {
  name: string;
  key: string;
  description: string;
}
export interface IProduct {
  _id: string;
  name: string;
  short_name: string;
  does_have_license: boolean;
  description: string;
  default_number_of_licenses: number;
  modules: IProductModule[];
  reports: IProductModule[];
}
