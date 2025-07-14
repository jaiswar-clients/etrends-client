"use client";
import React from "react";
import Link from "next/link";

const reports = [
  {
    title: "Customer-wise product adoption over the years",
    api: "getCustomerProductAdoptionReport",
  },
  {
    title: "Industry-wise product distribution and gaps.",
    api: "getIndustryProductDistributionReport",
  },
  {
    title: "Domestic vs International revenue split, with average realization per product.",
    api: "getDomesticInternationalRevenueReport",
  },
  {
    title: "Direct vs Franchise sales breakdown (volume and value).",
    api: "getDirectFranchiseSalesReport",
  },
  {
    title: "Realization variation across clients for the same product (e.g., LERMS sold at different prices).",
    api: "getProductRealisationVariationReport",
  },
  {
    title: "Identification of clients with upsell potential (low AMC or product count).",
    api: "getUpsellPotentialClientsReport",
  },
  {
    title: "Mapping of cross-sell opportunities: who has LARS but not LERMS/LLCS/LICM.",
    api: "getCrossSellOpportunitiesReport",
  },
  {
    title: "Partner-wise performance (sales contribution, margin levels).",
    api: "getPartnerPerformanceReport",
  },
];

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const AiReportsPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AI Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Link
            href={`/ai-reports/${slugify(report.title)}`}
            key={report.title}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 block"
          >
            {report.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AiReportsPage; 