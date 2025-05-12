import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomDateRangePicker } from './DateRangePicker';

// Generate financial years from 2000 to current year + 10
export const generateFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2000; year <= currentYear + 10; year++) {
        years.push({
            id: `FY${year}-${year + 1}`,
            label: `FY ${year}-${year + 1}`,
            startDate: new Date(year, 3, 1).toISOString(), // April 1st
            endDate: new Date(year + 1, 2, 31).toISOString(), // March 31st
        });
    }
    return years;
}

const financialYears = generateFinancialYears();

interface FinancialYearFilterProps {
    selectedFY?: string;
    onFYFilterChange: (fy: string | undefined) => void;
    onCustomDateChange: (startDate: string, endDate: string) => void;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    buttonLabel?: string;
}

const FinancialYearFilter: React.FC<FinancialYearFilterProps> = ({
    selectedFY,
    onFYFilterChange,
    onCustomDateChange,
    dateRange,
    buttonLabel = "Financial Year"
}) => {
    const handleCustomDateRangeChange = (range: { startDate: Date | null, endDate: Date | null }) => {
        if (range.startDate && range.endDate) {
            onCustomDateChange(
                range.startDate.toISOString(),
                range.endDate.toISOString()
            );
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    {selectedFY
                        ? financialYears.find(fy => fy.id === selectedFY)?.label || buttonLabel
                        : buttonLabel}
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[350px] p-4 overflow-y-auto max-h-[400px]" align="start">
                <div className="mb-4">
                    <div className="font-medium mb-2">Financial Year</div>
                    <Select
                        value={selectedFY || "all-years"}
                        onValueChange={(value) => {
                            if (value === "all-years") {
                                onFYFilterChange(undefined);
                            } else if (value === "custom-date") {
                                // Open custom date option
                                onFYFilterChange(undefined);
                            } else {
                                const selectedYear = financialYears.find(fy => fy.id === value);
                                if (selectedYear) {
                                    onFYFilterChange(value);
                                    // Apply the date range for this FY
                                    onCustomDateChange(selectedYear.startDate, selectedYear.endDate);
                                }
                            }
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Financial Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-years">All Years</SelectItem>
                            {financialYears.map((fy) => (
                                <SelectItem key={fy.id} value={fy.id}>
                                    {fy.label}
                                </SelectItem>
                            ))}
                            <SelectItem value="custom-date">Custom Date Range</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="mb-2">
                    <div className="font-medium mb-2">Custom Date Range</div>
                    <CustomDateRangePicker
                        onChange={handleCustomDateRangeChange}
                        initialStartDate={dateRange.startDate}
                        initialEndDate={dateRange.endDate}
                        minYear={2000}
                        maxYear={2030}
                        className="w-full"
                    />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default FinancialYearFilter; 