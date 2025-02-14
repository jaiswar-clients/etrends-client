"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface DateRange {
    from: Date | undefined
    to: Date | undefined
}

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    dateRange: DateRange | undefined
    onDateRangeChange: (date: DateRange | undefined) => void
    disabled?: boolean
    placeholder?: string
}

export function DatePickerWithRange({
    className,
    dateRange,
    onDateRangeChange,
    disabled,
}: DatePickerWithRangeProps) {
    const [fromInput, setFromInput] = React.useState("")
    const [toInput, setToInput] = React.useState("")

    // Update inputs when dateRange changes externally
    React.useEffect(() => {
        if (dateRange?.from) {
            setFromInput(format(dateRange.from, "MM/dd/yyyy"))
        } else {
            setFromInput("")
        }
        if (dateRange?.to) {
            setToInput(format(dateRange.to, "MM/dd/yyyy"))
        } else {
            setToInput("")
        }
    }, [dateRange])

    const isValidDateFormat = (value: string) => {
        // Check if the input matches MM/DD/YYYY format
        return /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(value);
    }

    const validateAndUpdateDates = (fromDate: string, toDate: string) => {
        // Only proceed if at least one date is in valid format
        const isFromValid = fromDate ? isValidDateFormat(fromDate) : true;
        const isToValid = toDate ? isValidDateFormat(toDate) : true;

        if (!isFromValid || !isToValid) return;

        const parsedFromDate = fromDate ? parse(fromDate, "MM/dd/yyyy", new Date()) : undefined
        const parsedToDate = toDate ? parse(toDate, "MM/dd/yyyy", new Date()) : undefined

        if (fromDate && !isValid(parsedFromDate)) return
        if (toDate && !isValid(parsedToDate)) return

        // Only update if we have both valid dates
        if (parsedFromDate && parsedToDate) {
            // Ensure from date is not after to date
            if (parsedFromDate > parsedToDate) return

            onDateRangeChange({
                from: parsedFromDate,
                to: parsedToDate
            })
        } else if (!fromDate && !toDate) {
            // Clear the date range if both inputs are empty
            onDateRangeChange(undefined)
        }
    }

    const formatDateInput = (value: string) => {
        // Remove any non-digit characters
        const digits = value.replace(/\D/g, '');
        
        // Format as MM/DD/YYYY
        if (digits.length <= 2) {
            return digits;
        } else if (digits.length <= 4) {
            return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else {
            return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }
    }

    const handleInputChange = (value: string, isFrom: boolean) => {
        // Format the input value
        const formattedValue = formatDateInput(value);
        
        if (isFrom) {
            setFromInput(formattedValue)
            // Only validate if we have a complete date format or empty string
            if (formattedValue === '' || isValidDateFormat(formattedValue)) {
                validateAndUpdateDates(formattedValue, toInput)
            }
        } else {
            setToInput(formattedValue)
            // Only validate if we have a complete date format or empty string
            if (formattedValue === '' || isValidDateFormat(formattedValue)) {
                validateAndUpdateDates(fromInput, formattedValue)
            }
        }
    }

    return (
        <div className={cn("flex gap-2 items-center", className)}>
            <Input
                type="text"
                placeholder="MM/DD/YYYY"
                value={fromInput}
                onChange={(e) => handleInputChange(e.target.value, true)}
                disabled={disabled}
                className="w-[140px]"
                maxLength={10}
            />
            <span className="flex items-center">-</span>
            <Input
                type="text"
                placeholder="MM/DD/YYYY"
                value={toInput}
                onChange={(e) => handleInputChange(e.target.value, false)}
                disabled={disabled}
                className="w-[140px]"
                maxLength={10}
            />
        </div>
    )
}

