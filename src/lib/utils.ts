import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dateToHumanReadable(date: Date | string) {
  return new Date(date).toLocaleDateString();
}

// create a function which takes whole string and capitalize first letter of each word
export function capitalizeFirstLetter(str: string) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatNumber(value: string): string {
  // Remove any non-digit characters except for the decimal point
  const cleanValue = value.replace(/[^\d.]/g, "");

  // Split the number into integer and decimal parts
  const [integerPart, decimalPart] = cleanValue.split(".");

  // Add commas to the integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Combine the formatted integer part with the decimal part (if it exists)
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

export function formatCurrency(value: number, precision?: number) {
  if (isNaN(value)) {
    return "0.00";
  }
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: precision ?? 2,
    minimumFractionDigits: precision ?? 2,
    style: "currency", 
    currency: "INR",
  });
}
