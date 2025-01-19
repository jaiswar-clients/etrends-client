"use client"

import * as React from "react"
import { addDays, format, isValid } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    placeholder = "Pick a date range",
}: DatePickerWithRangeProps) {
    const [month, setMonth] = React.useState(() => dateRange?.from || new Date())

    // Update month when dateRange changes externally
    React.useEffect(() => {
        if (dateRange?.from) {
            setMonth(dateRange.from)
        }
    }, [dateRange])

    const years = Array.from({ length: 121 }, (_, i) => 2025 - i)
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const handleYearChange = (year: string) => {
        const newDate = new Date(month)
        newDate.setFullYear(parseInt(year, 10))
        if (isValid(newDate)) {
            setMonth(newDate)
        }
    }

    const handleMonthChange = (monthIndex: string) => {
        const newDate = new Date(month)
        newDate.setMonth(parseInt(monthIndex, 10))
        if (isValid(newDate)) {
            setMonth(newDate)
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        disabled={disabled}
                        className={cn(
                            "w-full max-w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex gap-4 p-2">
                        <div className="space-y-2 w-full">
                            <Select
                                onValueChange={handleYearChange}
                                defaultValue={month.getFullYear().toString()}
                                disabled={disabled}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                onValueChange={handleMonthChange}
                                defaultValue={month.getMonth().toString()}
                                disabled={disabled}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month, index) => (
                                        <SelectItem key={month} value={index.toString()}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={month}
                        selected={dateRange}
                        onSelect={onDateRangeChange}
                        month={month}
                        onMonthChange={setMonth}
                        numberOfMonths={2}
                        disabled={disabled}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

