"use client"

import { useCallback, useRef } from 'react'
import { useCheckDuplicatesMutation } from '@/redux/api/order'
import { toast } from '@/hooks/use-toast'

type PurchaseType = 'order' | 'license' | 'customization' | 'additional-service'

interface DuplicateCheckOptions {
  debounceMs?: number;
  onDuplicateFound?: (duplicates: any[]) => void;
}

interface DuplicateRecord {
  id: string;
  type: string;
  description: string;
}

export function useDuplicateCheck(options: DuplicateCheckOptions = {}) {
  const { debounceMs = 500, onDuplicateFound } = options
  const [checkDuplicates, { isLoading }] = useCheckDuplicatesMutation()
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const lastWarningRef = useRef<string>('')

  const showDuplicateWarning = (duplicates: DuplicateRecord[]) => {
    const duplicateDescriptions = duplicates.map(d => `- ${d.description}`).join('\n')
    toast({
      variant: 'destructive',
      title: 'Duplicate Purchase Warning',
      description: `Potential duplicate purchases found:\n\n${duplicateDescriptions}\n\nYou can still proceed with creating this record.`,
    })
  }

  const debouncedCheck = useCallback(async (
    purchaseType: PurchaseType,
    clientId: string,
    data: any,
    skipIfLoading: boolean = false
  ) => {
    // Skip if previous check is still loading (onchange)
    if (skipIfLoading && isLoading) {
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounce
    debounceTimerRef.current = setTimeout(async () => {
      const requestData = prepareDuplicateCheckRequest(purchaseType, clientId, data);

      try {
        const result = await checkDuplicates(requestData).unwrap();

        if (result.data.hasDuplicate) {
          // Create unique key for warning to avoid showing same warning repeatedly
          const warningKey = JSON.stringify({
            purchaseType,
            clientId,
            purchaseOrderNumber: data.purchase_order_number,
            invoiceNumber: data.invoice_number,
          });

          // Only show warning if it's different from the last one
          if (warningKey !== lastWarningRef.current) {
            lastWarningRef.current = warningKey;
            showDuplicateWarning(result.data.duplicateRecords);
            onDuplicateFound?.(result.data.duplicateRecords);
          }
        } else {
          // Clear last warning if no duplicate found
          lastWarningRef.current = '';
        }
      } catch (error) {
        console.error('Duplicate check failed:', error);
      }
    }, debounceMs);
  }, [checkDuplicates, isLoading, debounceMs, onDuplicateFound]);

  const checkOnSubmit = useCallback(async (
    purchaseType: PurchaseType,
    clientId: string,
    data: any
  ) => {
    try {
      // Immediate check (no debounce) for submit
      const requestData = prepareDuplicateCheckRequest(purchaseType, clientId, data);
      const result = await checkDuplicates(requestData).unwrap();

      if (result.data.hasDuplicate) {
        showDuplicateWarning(result.data.duplicateRecords);
        return true; // Has duplicate, but allow proceed
      }
      return false;
    } catch (error) {
      // If duplicate check fails, allow the user to proceed anyway
      console.error('Duplicate check failed on submit:', error);
      return false;
    }
  }, [checkDuplicates]);

  const clearLastWarning = useCallback(() => {
    lastWarningRef.current = '';
  }, []);

  return { debouncedCheck, checkOnSubmit, isLoading, clearLastWarning };
}

// Helper function to prepare request based on purchase type
function prepareDuplicateCheckRequest(
  purchaseType: PurchaseType,
  clientId: string,
  data: any
) {
  const baseRequest = {
    clientId,
    purchaseType,
    purchaseOrderNumber: data.purchase_order_number,
  };

  switch (purchaseType) {
    case 'order':
      return {
        ...baseRequest,
        productIds: data.products || [],
      };
    case 'license':
      return {
        ...baseRequest,
        productId: data.product_id,
      };
    case 'customization':
      return {
        ...baseRequest,
        productId: data.product_id,
        invoiceNumber: data.invoice_number,
      };
    case 'additional-service':
      return {
        ...baseRequest,
        productId: data.product_id,
        invoiceNumber: data.invoice_number,
      };
    default:
      return baseRequest;
  }
}
