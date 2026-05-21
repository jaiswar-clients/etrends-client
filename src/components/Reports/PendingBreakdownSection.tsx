'use client';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetPendingBreakdownQuery } from '@/redux/api/report';
import PeriodGranularitySelector, {
  type Granularity,
} from '@/components/common/PeriodGranularitySelector';
import { getCurrentFinancialYearId } from '@/components/common/FinancialYearFilter';
import { formatCurrency } from '@/lib/utils';

export default function PendingBreakdownSection() {
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const fy = getCurrentFinancialYearId();
  const { data, isLoading } = useGetPendingBreakdownQuery({ fy, granularity });

  if (isLoading) return <div>Loading breakdown...</div>;

  const buckets = data?.buckets ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pending Payment Breakdown</h3>
        <PeriodGranularitySelector
          value={granularity}
          onChange={setGranularity}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Pending Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buckets.map((b) => (
            <TableRow key={b.label}>
              <TableCell>{b.label}</TableCell>
              <TableCell className="text-right">{b.count}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(b.pending_amount)}
              </TableCell>
            </TableRow>
          ))}
          {totals && (
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totals.count}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.pending_amount)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
