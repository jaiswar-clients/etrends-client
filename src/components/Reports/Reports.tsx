"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    IReportQueries,
    useGetExpectedVsReceivedRevenueQuery,
    useGetIndustryWiseRevenueReportQuery,
    useGetProductWiseRevenueReportQuery,
    useGetTotalBillingReportQuery,
    useGetAMCAnnualBreakDownQuery
} from '@/redux/api/report'
import DoubleBarChart from './Chart/DoubleBarChart'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { capitalizeFirstLetter } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import ParetoChart from './Chart/PeratoChart'
import DoubleAreaChart from './Chart/DoubleAreaChart'
import MultipleStackedChart from './Chart/StackedChart'
import AMCRevenue from './Chart/AMCRevenue'
import RadialChart from './Chart/RadialChart'
import { Button } from '../ui/button'

export const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 15; i--) {
        years.push(i);
    }
    return years;
};

export const generateQuarters = (year: number) => {
    const quarters = [];
    for (let i = 1; i <= 4; i++) {
        quarters.push(`Q${i} ${year}`);
    }
    return quarters;
};

export const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly', value: 'yearly' },
]

export const SelectComponent = ({
    onValueChange,
    placeholder,
    options,
    width = "180px",
}: {
    onValueChange: (value: string) => void;
    placeholder: string;
    options: Array<{ value: string; label: string }>;
    width?: string;
}) => (
    <Select onValueChange={onValueChange}>
        <SelectTrigger style={{ width }}>
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
            {options.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                    {label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

const Reports = () => {
    const [filters, setFilters] = useState<IReportQueries>({ filter: "monthly", options: {} })

    const {
        data: totalBillingApiRes,
        isLoading: isTotalBillingApiLoading,
        refetch: totalBillingApiRefetch
    } = useGetTotalBillingReportQuery(filters)
    const {
        data: productWiseRevenueApiRes,
        isLoading: isProductWiseRevenuApiLoading,
        refetch: productWiseRevenueApiRefetch
    } = useGetProductWiseRevenueReportQuery(filters)
    const {
        data:
        expectedVsReceivedApiRes,
        isLoading: isExpectedVsReceivedRevenueApiLoading,
        refetch: expectedVsReceivedRefetch,
    } = useGetExpectedVsReceivedRevenueQuery(filters)
    const {
        data: industryWiseRevenueApiRes,
        isLoading: isIndustryWiseRevenueApiLoading,
        refetch: industryWiseRevenueRefetch,
    } = useGetIndustryWiseRevenueReportQuery(filters)
    const {
        data: amcAnnualBreakDownApiRes,
        isLoading: isAMCAnnualBreakDownApiLoading,
        refetch: amcAnnualBreakDownRefetch,
    } = useGetAMCAnnualBreakDownQuery(filters)

    const productWiseRevenueData = productWiseRevenueApiRes?.data?.map(item => ({
        name: item.productName,
        revenue: item.revenue,
        cumulativePercentage: item.cumulativePercentage
    })) ?? [];

    const totalBillingData = (totalBillingApiRes?.data ?
        totalBillingApiRes.data.map((item) => ({
            period: item.period,
            value1: item.total_purchase_billing,
            value2: item.total_amc_billing
        }))
        : [])

    const expectedVsReceivedData = expectedVsReceivedApiRes?.data?.map((item) => ({
        period: item.period,
        value1: item.expected_amount,
        value2: item.received_amount
    })) ?? []

    const totalBillingRadialChartData = useMemo(() => {
        return totalBillingData.reduce((acc, item) => {
            acc.total_purchase_billing += item.value1;
            acc.total_amc_billing += item.value2;
            return acc;
        }, { total_amc_billing: 0, total_purchase_billing: 0 })
    }, [totalBillingData])

    const totalAMCRevenueRadialChartData = useMemo(() => {
        return amcAnnualBreakDownApiRes?.data?.reduce((acc, item) => {
            acc.total_expected += item.totalExpected;
            acc.total_collected += item.totalCollected;
            return acc;
        }, { total_expected: 0, total_collected: 0 })
    }, [amcAnnualBreakDownApiRes?.data])

    const chartRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        refetchChartsData()
    }, [filters])

    const handleDownloadPDF = () => {
        const chartElement = chartRef.current;
        if (!chartElement) return;

        html2canvas(chartElement, { scale: 2 }).then((canvas) => {
            const pdf = new jsPDF("landscape", "mm", "a4");
            const imgData = canvas.toDataURL("image/png");

            // Add a title to the PDF
            pdf.setFontSize(18).setFont("Helvetica", "", "bold");
            pdf.text("All Reports", 10, 10);

            // Add custom text below the title
            pdf.setFontSize(12).setFont("Helvetica", "color: #bfbfbf;", 500);
            pdf.text("Generated on: " + new Date().toLocaleDateString(), 10, 15);

            // Add filter information on the right side
            pdf.setFontSize(12);
            pdf.text(`Filter: ${capitalizeFirstLetter(filters.filter)}`, pdf.internal.pageSize.width - 40, 10);

            if (filters.filter === 'quarterly') {
                pdf.text(`Quarter: ${filters.options?.quarter}`, pdf.internal.pageSize.width - 40, 15);
            }

            if (filters.filter !== 'all') {
                pdf.text(`Year: ${filters.options?.year}`, pdf.internal.pageSize.width - 40, filters.filter === 'quarterly' ? 20 : 15);
            }

            // Add the chart image to the PDF
            const imgWidth = 280; // Fit the width for A4
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 10, 30, imgWidth, imgHeight);

            // Add detailed explanations for each chart
            let yPosition = imgHeight + 40;

            // Total Billing Radial Chart
            pdf.setFontSize(14).setFont("Helvetica", "", "bold");
            pdf.text("New Business vs AMC", 10, yPosition);
            yPosition += 10;
            pdf.setFontSize(12).setFont("Helvetica", "", "normal");
            pdf.text(`Total Purchase Billing: $${totalBillingRadialChartData.total_purchase_billing.toFixed(2)}`, 10, yPosition);
            yPosition += 5;
            pdf.text(`Total AMC Billing: $${totalBillingRadialChartData.total_amc_billing.toFixed(2)}`, 10, yPosition);
            yPosition += 10;

            // AMC Revenue Radial Chart
            pdf.setFontSize(14).setFont("Helvetica", "", "bold");
            pdf.text("AMC Expected vs Collected", 10, yPosition);
            yPosition += 10;
            pdf.setFontSize(12).setFont("Helvetica", "", "normal");
            pdf.text(`Total Expected: $${totalAMCRevenueRadialChartData?.total_expected.toFixed(2)}`, 10, yPosition);
            yPosition += 5;
            pdf.text(`Total Collected: $${totalAMCRevenueRadialChartData?.total_collected.toFixed(2)}`, 10, yPosition);
            yPosition += 10;

            // Total Billing Bar Chart
            pdf.setFontSize(14).setFont("Helvetica", "", "bold");
            pdf.text("Total Billing Over Time", 10, yPosition);
            yPosition += 10;
            pdf.setFontSize(12).setFont("Helvetica", "", "normal");
            totalBillingData.forEach((item, index) => {
                if (index < 3) { // Limit to first 3 entries to save space
                    pdf.text(`${item.period}: New Business $${item.value1.toFixed(2)}, AMC $${item.value2.toFixed(2)}`, 10, yPosition);
                    yPosition += 5;
                }
            });
            yPosition += 5;

            // Product Wise Revenue
            pdf.setFontSize(14).setFont("Helvetica", "", "bold");
            pdf.text("Product Wise Revenue", 10, yPosition);
            yPosition += 10;
            pdf.setFontSize(12).setFont("Helvetica", "", "normal");
            productWiseRevenueData.forEach((item, index) => {
                if (index < 3) { // Limit to first 3 entries to save space
                    pdf.text(`${item.name}: $${item.revenue.toFixed(2)} (${item.cumulativePercentage.toFixed(2)}%)`, 10, yPosition);
                    yPosition += 5;
                }
            });
            yPosition += 5;

            // Expected vs Received Revenue
            pdf.setFontSize(14).setFont("Helvetica", "", "bold");
            pdf.text("Expected vs Received Revenue", 10, yPosition);
            yPosition += 10;
            pdf.setFontSize(12).setFont("Helvetica", "", "normal");
            expectedVsReceivedData.forEach((item, index) => {
                if (index < 3) { // Limit to first 3 entries to save space
                    pdf.text(`${item.period}: Expected $${item.value1.toFixed(2)}, Received $${item.value2.toFixed(2)}`, 10, yPosition);
                    yPosition += 5;
                }
            });

            // Save the PDF
            pdf.save(`All Reports ${new Date().toLocaleDateString()}.pdf`);
        });
    };

    const refetchChartsData = () => {
        totalBillingApiRefetch()
        productWiseRevenueApiRefetch()
        expectedVsReceivedRefetch()
        industryWiseRevenueRefetch()
        amcAnnualBreakDownRefetch()
    }

    const onFilterChange = (value: string) => {
        const updatedFilters = { ...filters };

        if (value === "quarterly") {
            const quarterIndex = Math.floor(new Date().getMonth() / 3) || 0;
            const quarter = generateQuarters(new Date().getFullYear())[quarterIndex];
            const year = new Date().getFullYear();
            updatedFilters.filter = value as "quarterly" | "yearly" | "all";
            updatedFilters.options = { ...updatedFilters.options, year, quarter };
        } else {
            updatedFilters.filter = value as "monthly" | "yearly" | "all";
        }

        setFilters(updatedFilters);
    };

    const onOptionChange = (key: string, value: string) => {
        const updatedFilters = {
            ...filters,
            options: { ...filters.options, [key]: value },
        };

        setFilters(updatedFilters);
    };

    const customChartContainerHeight = "h-[150px]"

    return (
        <div className=''>
            <div className="flex justify-between items-center ">
                <div className="flex justify-start items-center gap-3">
                    {filters.filter === "quarterly" && (
                        <SelectComponent
                            onValueChange={(value) => onOptionChange("quarter", value)}
                            placeholder={filters.options?.quarter || "Select a Quarter"}
                            options={
                                generateQuarters(Number(filters.options?.year) || new Date().getFullYear()).map(
                                    (q) => ({
                                        value: q,
                                        label: q,
                                    })
                                )
                            }
                        />
                    )}
                    {filters.filter !== "all" && (
                        <SelectComponent
                            onValueChange={(value) => onOptionChange("year", value)}
                            placeholder={filters.options?.year?.toString() || "Select a Year"}
                            options={generateYears().map((year) => ({
                                value: year.toString(),
                                label: year.toString(),
                            }))}
                        />
                    )}

                    <SelectComponent
                        onValueChange={onFilterChange}
                        placeholder={filters.filter ? capitalizeFirstLetter(filters.filter) : "Select a filter"}
                        options={filterOptions}
                    />
                </div>
                <div className="">
                    <Button onClick={handleDownloadPDF}>Download Report</Button>
                </div>
            </div>
            <div ref={chartRef}>
                <div className="w-full flex justify-between gap-6 mt-4">
                    <RadialChart data={totalBillingRadialChartData} title='New Business vs AMC' valueToDisplay='total_purchase_billing' footerText={
                        <div className="flex items-center gap-2">   
                            <span>From: <b>{totalBillingApiRes?.data?.[0]?.period}</b></span>
                            <span>To: <b>{totalBillingApiRes?.data?.[totalBillingApiRes?.data?.length - 1]?.period}</b></span>
                        </div>
                    } />
                    <RadialChart data={totalAMCRevenueRadialChartData || {}} title='AMC Expected vs Collected' valueToDisplay='total_collected' footerText={
                        <div className="flex items-center gap-2">
                            <span>From: <b>{amcAnnualBreakDownApiRes?.data?.[0]?.period}</b></span>
                            <span>To: <b>{amcAnnualBreakDownApiRes?.data?.[amcAnnualBreakDownApiRes?.data?.length - 1]?.period}</b></span>
                        </div>
                    } />
                </div>
                <div className="w-full flex justify-between gap-6 mt-4">
                    <DoubleBarChart
                        data={totalBillingData}
                        isLoading={isTotalBillingApiLoading}
                        description="Total Purchase Billing vs Total AMC Billing"
                        header="Total Billing"
                        bar1Label='New Business'
                        bar2Label='AMC Billing'
                        chartConfigClassName={`${customChartContainerHeight} w-full mt-0`}
                    />
                    <ParetoChart
                        data={productWiseRevenueData}
                        isLoading={isProductWiseRevenuApiLoading}
                        header="Product Wise Revenue"
                        description="Revenue generated from each product."
                        chartConfigClassName={`${customChartContainerHeight} mt-0`}
                    />
                </div>
                <div className="w-full flex justify-between gap-6 mt-4">
                    <DoubleAreaChart
                        data={expectedVsReceivedData}
                        isLoading={isExpectedVsReceivedRevenueApiLoading}
                        description="Expected vs Actual Revenue"
                        header="Revenue Comparison"
                        area1Label='Expected Revenue'
                        area2Label='Actual Revenue'
                        chartConfigClassName={`${customChartContainerHeight} mt-0`}
                    />
                    <MultipleStackedChart
                        data={industryWiseRevenueApiRes?.data ?? []}
                        isLoading={isIndustryWiseRevenueApiLoading}
                        header="Industry Wise Revenue"
                        description="Revenue generated from each industry."
                        chartConfigClassName={`${customChartContainerHeight} mt-0`}
                    />
                    <AMCRevenue
                        data={amcAnnualBreakDownApiRes?.data || []}
                        isLoading={isAMCAnnualBreakDownApiLoading}
                        header="AMC Revenue"
                        description="Total AMC Revenue"
                        chartConfigClassName={`${customChartContainerHeight} mt-0`}
                    />
                </div>
            </div>
        </div>
    )
}

export default Reports