'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PendingPaymentsDataTable from './PendingPaymentsDataTable';
import AmcStartMissingTab from './AmcStartMissingTab';
import { IPendingPayment, IPendingPaymentPagination, IFilteredClient, IPendingPaymentType } from '@/types/order';

interface PendingPaymentTabsProps {
  data: IPendingPayment[];
  pagination: IPendingPaymentPagination;
  handlePagination: (page: number) => void;
  selectedFY?: string;
  onFYFilterChange: (fy: string | undefined) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  };
  clients: IFilteredClient[];
  selectedClientId?: string;
  onClientFilterChange: (clientId: string | undefined) => void;
  selectedType: IPendingPaymentType;
  onTypeFilterChange: (type: IPendingPaymentType) => void;
}

export default function PendingPaymentTabs(props: PendingPaymentTabsProps) {
  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">Pending Payments</TabsTrigger>
        <TabsTrigger value="amc-missing">AMC Start Missing</TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <PendingPaymentsDataTable {...props} />
      </TabsContent>
      <TabsContent value="amc-missing">
        <AmcStartMissingTab />
      </TabsContent>
    </Tabs>
  );
}
