'use client';
import { useGetAmcStartMissingQuery } from '@/redux/api/order';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

export default function AmcStartMissingTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAmcStartMissingQuery({
    page,
    limit: 20,
  });

  if (isLoading) return <div>Loading...</div>;

  const rows = data?.data?.rows ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead className="text-right">Base Cost</TableHead>
              <TableHead className="text-right">Pending Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.order_id}>
                <TableCell>
                  <Link
                    href={`/orders/${r.order_id}`}
                    className="underline"
                  >
                    {r.order_id.slice(-6)}
                  </Link>
                </TableCell>
                <TableCell>{r.client_name}</TableCell>
                <TableCell>{r.product_name}</TableCell>
                <TableCell>
                  {r.purchased_date
                    ? new Date(r.purchased_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(r.base_cost)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(r.pending_balance)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {rows.length} orders (Total {pagination.total})
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                {pagination.currentPage > 1 ? (
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                ) : (
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="opacity-50 cursor-not-allowed"
                  />
                )}
              </PaginationItem>

              {Array.from({ length: pagination.totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.totalPages ||
                  Math.abs(pageNumber - pagination.currentPage) <= 1
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNumber);
                        }}
                        isActive={pagination.currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                if (
                  (pageNumber === 2 && pagination.currentPage > 3) ||
                  (pageNumber === pagination.totalPages - 1 &&
                    pagination.currentPage < pagination.totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return null;
              })}

              <PaginationItem>
                {pagination.currentPage < pagination.totalPages ? (
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => p + 1);
                    }}
                  />
                ) : (
                  <PaginationNext
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="opacity-50 cursor-not-allowed"
                  />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
