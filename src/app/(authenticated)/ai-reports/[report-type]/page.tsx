"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetCustomerProductAdoptionReportQuery,
  useGetIndustryProductDistributionReportQuery,
  useGetDomesticInternationalRevenueReportQuery,
  useGetDirectFranchiseSalesReportQuery,
  useGetProductRealisationVariationReportQuery,
  useGetUpsellPotentialClientsReportQuery,
  useGetCrossSellOpportunitiesReportQuery,
  useGetPartnerPerformanceReportQuery,
} from "@/redux/api/orderAi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

const ReportPage = () => {
  const params = useParams();
  const router = useRouter();
  const reportSlug = params["report-type"] as string;

  const [showConfirm, setShowConfirm] = useState(true);
  const [generateReport, setGenerateReport] = useState(false);
  const [enableThinking, setEnableThinking] = useState(false);

  const report = reports.find((r) => slugify(r.title) === reportSlug);

  const adoptionQuery = useGetCustomerProductAdoptionReportQuery(undefined, {
    skip:
      !generateReport ||
      !report ||
      report.api !== "getCustomerProductAdoptionReport",
  });

  const industryQuery = useGetIndustryProductDistributionReportQuery(undefined, {
    skip:
      !generateReport ||
      !report ||
      report.api !== "getIndustryProductDistributionReport",
  });

  const revenueQuery = useGetDomesticInternationalRevenueReportQuery(
    { enableThinking },
    {
      skip:
        !generateReport ||
        !report ||
        report.api !== "getDomesticInternationalRevenueReport",
    }
  );

  const salesQuery = useGetDirectFranchiseSalesReportQuery(
    { enableThinking },
    {
      skip:
        !generateReport ||
        !report ||
        report.api !== "getDirectFranchiseSalesReport",
    }
  );

  const realisationQuery = useGetProductRealisationVariationReportQuery(
    { enableThinking },
    {
      skip:
        !generateReport ||
        !report ||
        report.api !== "getProductRealisationVariationReport",
    }
  );

  const upsellQuery = useGetUpsellPotentialClientsReportQuery(
    { enableThinking },
    {
      skip:
        !generateReport ||
        !report ||
        report.api !== "getUpsellPotentialClientsReport",
    }
  );

  const crossSellQuery = useGetCrossSellOpportunitiesReportQuery(
    { enableThinking },
    {
      skip:
        !generateReport ||
        !report ||
        report.api !== "getCrossSellOpportunitiesReport",
    }
  );

  const partnerQuery = useGetPartnerPerformanceReportQuery(
    { enableThinking },
    {
      skip:
        !generateReport ||
        !report ||
        report.api !== "getPartnerPerformanceReport",
    }
  );

  const data =
    adoptionQuery.data ??
    industryQuery.data ??
    revenueQuery.data ??
    salesQuery.data ??
    realisationQuery.data ??
    upsellQuery.data ??
    crossSellQuery.data ??
    partnerQuery.data;
  const isLoading =
    adoptionQuery.isLoading ||
    industryQuery.isLoading ||
    revenueQuery.isLoading ||
    salesQuery.isLoading ||
    realisationQuery.isLoading ||
    upsellQuery.isLoading ||
    crossSellQuery.isLoading ||
    partnerQuery.isLoading;
  const isError =
    adoptionQuery.isError ||
    industryQuery.isError ||
    revenueQuery.isError ||
    salesQuery.isError ||
    realisationQuery.isError ||
    upsellQuery.isError ||
    crossSellQuery.isError ||
    partnerQuery.isError;

  useEffect(() => {
    if (generateReport && report && !report.api) {
      console.log(`Generate report for: ${report.title}`);
    }
  }, [generateReport, report]);

  if (!report) {
    return <div>Report not found</div>;
  }

  const handleGenerate = () => {
    if (report && !report.api) {
      console.log(`${report.title} clicked`);
    }
    setGenerateReport(true);
    setShowConfirm(false);
  };

  const handleCancel = () => {
    router.back();
  };

  const onDialogClose = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  const showThinkingCheckbox =
    report?.api !== "getCustomerProductAdoptionReport" &&
    report?.api !== "getIndustryProductDistributionReport";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{report.title}</h1>

      <Dialog open={showConfirm} onOpenChange={onDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Report Generation</DialogTitle>
            <DialogDescription>
              Are you sure you want to generate the report for &quot;{report.title}&quot;?
            </DialogDescription>
          </DialogHeader>
          {showThinkingCheckbox && (
            <div className="flex items-center space-x-2 my-4">
              <Checkbox
                id="enable-thinking"
                checked={enableThinking}
                onCheckedChange={(checked) => setEnableThinking(Boolean(checked))}
              />
              <Label htmlFor="enable-thinking">Enable thinking process</Label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showConfirm && (
        <div>
          {isLoading && (
            <div className="flex items-center justify-center flex-1 py-4 min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {isError && <p>Error loading report.</p>}
          {data && (
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data?.data.markdown}
              </ReactMarkdown>
            </div>
          )}
          {generateReport && !report.api && !isLoading && (
            <p>This report is not yet implemented. Check console for log.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportPage; 