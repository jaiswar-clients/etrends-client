/**
 * Fiscal Year utilities for Indian Financial Year (April-March)
 * 
 * Indian FY: April (month 3) to March (month 2)
 * Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar
 */

export interface FiscalYear {
  startYear: number;
  label: string;
}

export interface FiscalYearOption {
  value: string;
  label: string;
}

export interface Quarter {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface CurrentQuarter {
  quarter: string;
  year: number;
  label: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get the current fiscal year based on the current date
 * Returns { startYear, label } for the current Indian FY
 */
export function getCurrentFiscalYear(): FiscalYear {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // If month is Jan-Mar (0-2), we're in the previous calendar year's FY
  const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  const endYear = startYear + 1;
  
  return {
    startYear,
    label: `FY${(startYear % 100).toString().padStart(2, '0')}-${(endYear % 100).toString().padStart(2, '0')}`
  };
}

/**
 * Generate an array of fiscal year options for dropdowns
 * @param count Number of fiscal years to generate (default: 15)
 * Returns array of { value, label } starting from current FY going backwards
 */
export function generateFiscalYears(count: number = 15): FiscalYearOption[] {
  const currentFiscalYear = getCurrentFiscalYear();
  const fiscalYears: FiscalYearOption[] = [];
  
  for (let i = 0; i < count; i++) {
    const startYear = currentFiscalYear.startYear - i;
    const endYear = startYear + 1;
    const label = `FY${(startYear % 100).toString().padStart(2, '0')}-${(endYear % 100).toString().padStart(2, '0')}`;
    
    fiscalYears.push({
      value: startYear.toString(),
      label
    });
  }
  
  return fiscalYears;
}

/**
 * Get quarters for a given fiscal year
 * @param fiscalYearStart The starting year of the fiscal year (e.g., 2025 for FY25-26)
 * Returns array of 4 quarters with value, label, startDate, endDate
 */
export function getFiscalYearQuarters(fiscalYearStart: number): Quarter[] {
  const endYear = fiscalYearStart + 1;
  const fiscalYearLabel = `${(fiscalYearStart % 100).toString().padStart(2, '0')}-${(endYear % 100).toString().padStart(2, '0')}`;
  
  return [
    {
      value: `Q1 ${fiscalYearStart}`,
      label: `Q1 FY${fiscalYearLabel} (Apr-Jun)`,
      startDate: new Date(fiscalYearStart, 3, 1), // April 1
      endDate: new Date(fiscalYearStart, 5, 30)   // June 30
    },
    {
      value: `Q2 ${fiscalYearStart}`,
      label: `Q2 FY${fiscalYearLabel} (Jul-Sep)`,
      startDate: new Date(fiscalYearStart, 6, 1), // July 1
      endDate: new Date(fiscalYearStart, 8, 30)   // September 30
    },
    {
      value: `Q3 ${fiscalYearStart}`,
      label: `Q3 FY${fiscalYearLabel} (Oct-Dec)`,
      startDate: new Date(fiscalYearStart, 9, 1), // October 1
      endDate: new Date(fiscalYearStart, 11, 31)  // December 31
    },
    {
      value: `Q4 ${fiscalYearStart}`,
      label: `Q4 FY${fiscalYearLabel} (Jan-Mar)`,
      startDate: new Date(endYear, 0, 1),  // January 1
      endDate: new Date(endYear, 2, 31)    // March 31
    }
  ];
}

/**
 * Get the current fiscal quarter based on the current date
 * Returns { quarter, year, label }
 */
export function getCurrentFiscalQuarter(): CurrentQuarter {
  const now = new Date();
  const month = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Determine fiscal year start
  const fiscalYearStart = month < 3 ? currentYear - 1 : currentYear;
  
  let quarterNumber: number;
  if (month >= 3 && month <= 5) {
    quarterNumber = 1; // Apr-Jun
  } else if (month >= 6 && month <= 8) {
    quarterNumber = 2; // Jul-Sep
  } else if (month >= 9 && month <= 11) {
    quarterNumber = 3; // Oct-Dec
  } else {
    quarterNumber = 4; // Jan-Mar
  }
  
  const endYear = fiscalYearStart + 1;
  const fiscalYearLabel = `${(fiscalYearStart % 100).toString().padStart(2, '0')}-${(endYear % 100).toString().padStart(2, '0')}`;
  
  return {
    quarter: `Q${quarterNumber} ${fiscalYearStart}`,
    year: fiscalYearStart,
    label: `Q${quarterNumber} FY${fiscalYearLabel}`
  };
}

/**
 * Convert a fiscal year start year to a date range
 * @param fiscalYearStart The starting year of the fiscal year
 * Returns { startDate, endDate } for the entire fiscal year
 */
export function fiscalYearToDateRange(fiscalYearStart: number): DateRange {
  return {
    startDate: new Date(fiscalYearStart, 3, 1),  // April 1
    endDate: new Date(fiscalYearStart + 1, 2, 31) // March 31
  };
}

/**
 * Format a fiscal year start year to "FY25-26" format
 * @param fiscalYearStart The starting year of the fiscal year
 */
export function formatFiscalYear(fiscalYearStart: number): string {
  const endYear = fiscalYearStart + 1;
  return `FY${(fiscalYearStart % 100).toString().padStart(2, '0')}-${(endYear % 100).toString().padStart(2, '0')}`;
}

/**
 * Get the fiscal year start year for a given date
 * @param date The date to check
 * Returns the fiscal year start year (e.g., 2025 for FY25-26)
 */
export function getFiscalYearForDate(date: Date): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // If month is Jan-Mar (0-2), the fiscal year started in the previous calendar year
  return month < 3 ? year - 1 : year;
}

/**
 * Get the quarter number (1-4) for a given date within the fiscal year
 * @param date The date to check
 * Returns the quarter number (1-4)
 */
export function getQuarterForDate(date: Date): number {
  const month = date.getMonth();
  
  if (month >= 3 && month <= 5) return 1;  // Apr-Jun
  if (month >= 6 && month <= 8) return 2;  // Jul-Sep
  if (month >= 9 && month <= 11) return 3; // Oct-Dec
  return 4;                                 // Jan-Mar
}

/**
 * Get the date range for a specific quarter in a fiscal year
 * @param fiscalYearStart The starting year of the fiscal year
 * @param quarterNumber The quarter number (1-4)
 * Returns { startDate, endDate } for the specified quarter
 */
export function getQuarterDateRange(fiscalYearStart: number, quarterNumber: number): DateRange {
  const quarters = getFiscalYearQuarters(fiscalYearStart);
  const quarter = quarters[quarterNumber - 1];
  
  if (!quarter) {
    throw new Error(`Invalid quarter number: ${quarterNumber}. Must be 1-4.`);
  }
  
  return {
    startDate: quarter.startDate,
    endDate: quarter.endDate
  };
}

/**
 * Check if a date falls within a specific fiscal year
 * @param date The date to check
 * @param fiscalYearStart The starting year of the fiscal year
 */
export function isDateInFiscalYear(date: Date, fiscalYearStart: number): boolean {
  const dateFiscalYear = getFiscalYearForDate(date);
  return dateFiscalYear === fiscalYearStart;
}

/**
 * Get the month number within the fiscal year (1-12)
 * April = 1, May = 2, ..., March = 12
 * @param date The date to check
 */
export function getFiscalMonthNumber(date: Date): number {
  const month = date.getMonth();
  // April (3) -> 1, May (4) -> 2, ..., March (2) -> 12
  return ((month - 3 + 12) % 12) + 1;
}
