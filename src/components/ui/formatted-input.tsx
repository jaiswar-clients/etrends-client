"use client"

import React, { useState, useCallback } from 'react'
import { Input as DefaultInput } from "@/components/ui/input"
import { formatNumber } from '@/lib/utils'

interface FormattedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onValueChange?: (value: string) => void;
}

export const Input = React.forwardRef<HTMLInputElement, FormattedInputProps>(
    ({ onValueChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState('');

        const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = event.target.value;
            const formattedValue = formatNumber(rawValue);
            setDisplayValue(formattedValue);

            if (onValueChange) {
                // Pass the raw numeric value (without commas) to the parent component
                onValueChange(formattedValue.replace(/,/g, ''));
            }
        }, [onValueChange]);

        return (
            <DefaultInput
                {...props}
                ref={ref}
                value={displayValue}
                onChange={handleChange}
            />
        );
    }
);

Input.displayName = 'Input';

