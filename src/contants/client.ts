export enum INDUSTRIES_ENUM {
  Technology = "technology",
  Finance = "finance",
  Healthcare = "healthcare",
  Education = "education",
  RealEstate = "real estate",
  Retail = "retail",
  Manufacturing = "manufacturing",
  Transportation = "transportation",
  Energy = "energy",
  Entertainment = "entertainment",
  Agriculture = "agriculture",
  Construction = "construction",
  Legal = "legal",
  Marketing = "marketing",
  Hospitality = "hospitality",
  Telecommunications = "telecommunications",
  Government = "government",
  Insurance = "insurance",
  Media = "media",
  NonProfit = "non-profit",
  Automotive = "automotive",
  ConsumerGoods = "consumer goods",
  Pharmaceuticals = "pharmaceuticals",
  Aerospace = "aerospace",
  Mining = "mining",
  Biotechnology = "biotechnology",
}

export const industriesArray = Object.entries(INDUSTRIES_ENUM).map(
  ([key, value]) => ({
    name: key,
    value: value as string,
  })
);
