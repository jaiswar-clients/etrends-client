'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type Granularity = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export default function PeriodGranularitySelector(props: {
  value: Granularity;
  onChange: (g: Granularity) => void;
}) {
  return (
    <Select
      value={props.value}
      onValueChange={(v) => props.onChange(v as Granularity)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="quarterly">Quarterly</SelectItem>
        <SelectItem value="half-yearly">Half-Yearly</SelectItem>
        <SelectItem value="yearly">Yearly</SelectItem>
      </SelectContent>
    </Select>
  );
}
