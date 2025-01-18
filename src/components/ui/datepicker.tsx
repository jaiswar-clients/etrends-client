"use client"

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { CalendarIcon } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerProps {
    date: Date | undefined | string
    onDateChange: (date: Date | undefined) => void
    label?: string
    placeholder?: string
    disabled?: boolean
}

export default function DatePicker({
    date,
    onDateChange,
    disabled,
    placeholder = "Select date"
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Convert string date to Date object if needed
    const getValidDate = (date: Date | string | undefined): Date | undefined => {
        if (!date) return undefined

        if (typeof date === 'string') {
            try {
                const parsedDate = parseISO(date)
                return isValid(parsedDate) ? parsedDate : undefined
            } catch {
                return undefined
            }
        }

        return isValid(date) ? date : undefined
    }

    const validDate = getValidDate(date)

    const [currentMonth, setCurrentMonth] = React.useState(() => {
        if (validDate) {
            return validDate
        }
        return new Date()
    })

    const handleDateChange = (selectedDate: Date | undefined) => {
        if (selectedDate && isValid(selectedDate)) {
            onDateChange(selectedDate)
            setOpen(false)
        }
    }

    const handleYearChange = (year: string) => {
        try {
            const newDate = new Date(currentMonth)
            newDate.setFullYear(parseInt(year, 10))
            if (isValid(newDate)) {
                setCurrentMonth(newDate)
            }
        } catch (error) {
            console.error("Invalid year value:", error)
        }
    }

    const handleMonthChange = (month: string) => {
        try {
            const newDate = new Date(currentMonth)
            newDate.setMonth(parseInt(month, 10))
            if (isValid(newDate)) {
                setCurrentMonth(newDate)
            }
        } catch (error) {
            console.error("Invalid month value:", error)
        }
    }

    const years = Array.from({ length: 121 }, (_, i) => 2025 - i)
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const formattedDate = React.useMemo(() => {
        if (validDate) {
            try {
                return format(validDate, "PPP")
            } catch (error) {
                console.error("Invalid date format:", error)
                return null
            }
        }
        return null
    }, [validDate])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !formattedDate && "text-muted-foreground"
                    )}
                    onClick={() => setOpen(!open)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formattedDate ? formattedDate : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="flex flex-col gap-2 p-2">
                    <Select
                        onValueChange={handleYearChange}
                        defaultValue={currentMonth.getFullYear().toString()}
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
                        defaultValue={currentMonth.getMonth().toString()}
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
                <Calendar
                    mode="single"
                    selected={validDate}
                    onSelect={handleDateChange}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    initialFocus
                    disabled={disabled}
                />
            </PopoverContent>
        </Popover>
    )
}
