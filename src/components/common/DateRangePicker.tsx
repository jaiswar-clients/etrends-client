"use client"

import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"

type DateRange = {
  startDate: Date | null
  endDate: Date | null
}

interface CustomDateRangePickerProps {
  onChange: (range: DateRange) => void
  initialStartDate?: Date | null
  initialEndDate?: Date | null
  minYear?: number
  maxYear?: number
  className?: string
}

export function CustomDateRangePicker({
  onChange,
  initialStartDate = null,
  initialEndDate = null,
  minYear = 2023,
  maxYear = 2026,
  className = "",
}: CustomDateRangePickerProps) {
  // States
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    startDate: initialStartDate,
    endDate: initialEndDate,
  })
  const [selectionMode, setSelectionMode] = useState<"start" | "end">("start")
  const [manualInput, setManualInput] = useState({
    startDay: initialStartDate ? initialStartDate.getDate().toString() : "",
    startMonth: initialStartDate ? (initialStartDate.getMonth() + 1).toString() : "",
    startYear: initialStartDate ? initialStartDate.getFullYear().toString() : "",
    endDay: initialEndDate ? initialEndDate.getDate().toString() : "",
    endMonth: initialEndDate ? (initialEndDate.getMonth() + 1).toString() : "",
    endYear: initialEndDate ? initialEndDate.getFullYear().toString() : "",
  })
  const [showYearSelector, setShowYearSelector] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowYearSelector(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return ""
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`
  }

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  // Check if a date is in the selected range
  const isInRange = (day: number): boolean => {
    if (!selectedRange.startDate || !day) return false

    const currentDate = new Date(currentYear, currentMonth, day)

    if (!selectedRange.endDate) {
      return currentDate.getTime() === selectedRange.startDate.getTime()
    }

    return (
      currentDate.getTime() >= selectedRange.startDate.getTime() &&
      currentDate.getTime() <= selectedRange.endDate.getTime()
    )
  }

  // Check if a date is the start of the range
  const isRangeStart = (day: number): boolean => {
    if (!selectedRange.startDate || !day) return false

    const currentDate = new Date(currentYear, currentMonth, day)
    return currentDate.getTime() === selectedRange.startDate.getTime()
  }

  // Check if a date is the end of the range
  const isRangeEnd = (day: number): boolean => {
    if (!selectedRange.endDate || !day) return false

    const currentDate = new Date(currentYear, currentMonth, day)
    return currentDate.getTime() === selectedRange.endDate.getTime()
  }

  // Handle date selection
  const handleDateSelect = (day: number) => {
    if (!day) return

    const selectedDate = new Date(currentYear, currentMonth, day)
    let newRange: DateRange;

    if (selectionMode === "start" || !selectedRange.startDate) {
      newRange = {
        startDate: selectedDate,
        endDate: null,
      };
      setSelectedRange(newRange)
      setSelectionMode("end")
    } else {
      // If selected date is before start date, swap them
      if (selectedDate < selectedRange.startDate) {
        newRange = {
          startDate: selectedDate,
          endDate: selectedRange.startDate,
        };
      } else {
        newRange = {
          ...selectedRange,
          endDate: selectedDate,
        };
      }
      setSelectedRange(newRange);
      setSelectionMode("start");
      setIsOpen(false);
      onChange(newRange); // Call onChange when range is complete
    }

    setErrorMessage("")
  }

  // Navigate to previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  // Navigate to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Get month name
  const getMonthName = (month: number): string => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return monthNames[month]
  }

  // Handle manual input change
  const handleManualInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof typeof manualInput,
  ) => {
    setManualInput({
      ...manualInput,
      [field]: e.target.value,
    })
  }

  // Apply manual input
  const applyManualInput = () => {
    try {
      // Validate start date
      if (manualInput.startDay && manualInput.startMonth && manualInput.startYear) {
        const startDay = Number.parseInt(manualInput.startDay)
        const startMonth = Number.parseInt(manualInput.startMonth) - 1
        const startYear = Number.parseInt(manualInput.startYear)

        if (
          isNaN(startDay) ||
          isNaN(startMonth) ||
          isNaN(startYear) ||
          startDay < 1 ||
          startDay > 31 ||
          startMonth < 0 ||
          startMonth > 11 ||
          startYear < minYear ||
          startYear > maxYear
        ) {
          setErrorMessage("Invalid start date")
          return
        }

        const maxDaysInStartMonth = getDaysInMonth(startYear, startMonth)
        if (startDay > maxDaysInStartMonth) {
          setErrorMessage(`Invalid day for ${getMonthName(startMonth)}`)
          return
        }

        const newStartDate = new Date(startYear, startMonth, startDay)

        // Validate end date if provided
        if (manualInput.endDay && manualInput.endMonth && manualInput.endYear) {
          const endDay = Number.parseInt(manualInput.endDay)
          const endMonth = Number.parseInt(manualInput.endMonth) - 1
          const endYear = Number.parseInt(manualInput.endYear)

          if (
            isNaN(endDay) ||
            isNaN(endMonth) ||
            isNaN(endYear) ||
            endDay < 1 ||
            endDay > 31 ||
            endMonth < 0 ||
            endMonth > 11 ||
            endYear < minYear ||
            endYear > maxYear
          ) {
            setErrorMessage("Invalid end date")
            return
          }

          const maxDaysInEndMonth = getDaysInMonth(endYear, endMonth)
          if (endDay > maxDaysInEndMonth) {
            setErrorMessage(`Invalid day for ${getMonthName(endMonth)}`)
            return
          }

          const newEndDate = new Date(endYear, endMonth, endDay)

          // Ensure end date is after start date
          if (newEndDate < newStartDate) {
            setErrorMessage("End date must be after start date")
            return
          }

          const newRange = {
            startDate: newStartDate,
            endDate: newEndDate,
          };
          setSelectedRange(newRange);
          onChange(newRange); // Call onChange
        } else {
          const newRange = {
            startDate: newStartDate,
            endDate: null, // Or newStartDate if a single date selection implies a range of one day
          };
          setSelectedRange(newRange);
          // Decide if onChange should be called here or if a single date selection is intermediate
          // For a range picker, typically we wait for both dates or an explicit apply.
          // If a single date is enough to trigger onChange, uncomment the line below.
          // onChange(newRange); 
        }

        setErrorMessage("")
        setIsOpen(false)
      } else if (manualInput.startDay || manualInput.startMonth || manualInput.startYear) {
        setErrorMessage("Please complete the start date")
      }
    } catch (error) {
      console.error(error)
      setErrorMessage("Invalid date format")
    }
  }

  // Generate years for year selector
  const generateYears = () => {
    const years = []
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year)
    }
    return years
  }

  // Select year
  const selectYear = (year: number) => {
    setCurrentYear(year)
    setShowYearSelector(false)
  }

  // Generate days for day selector
  const generateDays = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month - 1)
    const days = []
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  // Generate months for month selector
  const generateMonths = () => {
    return [
      { value: "1", label: "Jan" },
      { value: "2", label: "Feb" },
      { value: "3", label: "Mar" },
      { value: "4", label: "Apr" },
      { value: "5", label: "May" },
      { value: "6", label: "Jun" },
      { value: "7", label: "Jul" },
      { value: "8", label: "Aug" },
      { value: "9", label: "Sep" },
      { value: "10", label: "Oct" },
      { value: "11", label: "Nov" },
      { value: "12", label: "Dec" },
    ]
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Date display button */}
      <button
        className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open date picker"
      >
        <div className="flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
          <span>
            {selectedRange.startDate
              ? `${formatDate(selectedRange.startDate)}${
                  selectedRange.endDate ? ` - ${formatDate(selectedRange.endDate)}` : ""
                }`
              : "Select date range"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Dropdown calendar */}
      {isOpen && (
        <div className="z-10 mt-1 bg-white border rounded-md shadow-lg w-[320px]">
          <div className="p-2">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-2">
              <button className="p-1 rounded-full hover:bg-gray-100" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="px-2 py-1 text-sm font-medium hover:bg-gray-100 rounded"
                onClick={() => setShowYearSelector(!showYearSelector)}
              >
                {getMonthName(currentMonth)} {currentYear}
              </button>
              <button className="p-1 rounded-full hover:bg-gray-100" onClick={nextMonth} aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Year selector */}
            {showYearSelector ? (
              <div className="grid grid-cols-4 gap-1 mb-2">
                {generateYears().map((year) => (
                  <button
                    key={year}
                    className={`p-1 text-sm rounded ${
                      year === currentYear ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                    }`}
                    onClick={() => selectYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="flex items-center justify-center h-6 text-xs font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  {generateCalendarDays().map((day, index) => (
                    <div key={index} className="relative">
                      {day && (
                        <button
                          className={`w-full h-7 text-xs flex items-center justify-center rounded-full relative
                            ${isInRange(day) ? "bg-blue-100" : "hover:bg-gray-100"}
                            ${isRangeStart(day) ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                            ${isRangeEnd(day) ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                          `}
                          onClick={() => handleDateSelect(day)}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Manual input section */}
            <div className="border-t pt-2 mt-2">
              <div className="text-xs font-medium mb-2">Manual Input</div>

              {/* Start date inputs */}
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">Start Date</div>
                <div className="flex space-x-1">
                  <select
                    className="flex-1 px-1 py-1 text-xs border rounded"
                    value={manualInput.startDay}
                    onChange={(e) => handleManualInputChange(e, "startDay")}
                  >
                    <option value="">Day</option>
                    {generateDays(
                      Number.parseInt(manualInput.startYear) || new Date().getFullYear(),
                      Number.parseInt(manualInput.startMonth) || new Date().getMonth() + 1,
                    ).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <select
                    className="flex-1 px-1 py-1 text-xs border rounded"
                    value={manualInput.startMonth}
                    onChange={(e) => handleManualInputChange(e, "startMonth")}
                  >
                    <option value="">Month</option>
                    {generateMonths().map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="flex-1 px-1 py-1 text-xs border rounded"
                    value={manualInput.startYear}
                    onChange={(e) => handleManualInputChange(e, "startYear")}
                  >
                    <option value="">Year</option>
                    {generateYears().map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End date inputs */}
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">End Date</div>
                <div className="flex space-x-1">
                  <select
                    className="flex-1 px-1 py-1 text-xs border rounded"
                    value={manualInput.endDay}
                    onChange={(e) => handleManualInputChange(e, "endDay")}
                  >
                    <option value="">Day</option>
                    {generateDays(
                      Number.parseInt(manualInput.endYear) || new Date().getFullYear(),
                      Number.parseInt(manualInput.endMonth) || new Date().getMonth() + 1,
                    ).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <select
                    className="flex-1 px-1 py-1 text-xs border rounded"
                    value={manualInput.endMonth}
                    onChange={(e) => handleManualInputChange(e, "endMonth")}
                  >
                    <option value="">Month</option>
                    {generateMonths().map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="flex-1 px-1 py-1 text-xs border rounded"
                    value={manualInput.endYear}
                    onChange={(e) => handleManualInputChange(e, "endYear")}
                  >
                    <option value="">Year</option>
                    {generateYears().map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error message */}
              {errorMessage && <div className="text-xs text-red-500 mb-2">{errorMessage}</div>}

              {/* Apply button */}
              <button
                className="w-full py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={applyManualInput}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ChevronDown icon component
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
}
