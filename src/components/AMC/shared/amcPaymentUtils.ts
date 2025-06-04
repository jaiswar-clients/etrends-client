import * as z from "zod";

// Shared form schema
export const amcPaymentFormSchema = z.object({
  till_year: z.number().min(2024, {
    message: "Year must be at least 2024",
  }).max(2100, {
    message: "Year must not exceed 2100",
  }),
});

export type AmcPaymentFormValues = z.infer<typeof amcPaymentFormSchema>;

// Shared constants
export const DEFAULT_FORM_VALUES = {
  till_year: new Date().getFullYear() + 1,
};

// Shared toast messages
export const TOAST_MESSAGES = {
  success: {
    individual: (count: number) => ({
      title: "AMC Payments Created Successfully",
      description: `Created ${count} new payments for this AMC`,
    }),
    bulk: (paymentCount: number, amcCount: number) => ({
      title: "AMC Payments Created Successfully", 
      description: `Created ${paymentCount} new payments for ${amcCount} AMCs`,
    }),
  },
  error: {
    title: "Error",
    description: "Failed to create AMC payments",
    variant: "destructive" as const,
  },
};

// Shared info box content
export const INFO_BOX_CONTENT = {
  individual: {
    title: "About this operation:",
    items: [
      "Creates payment schedules for this specific AMC",
      "Only periods without existing payments will be added",
      "Payments will use the current AMC rate settings",
      "All new payments will be created with \"pending\" status",
    ],
  },
  bulk: {
    title: "Important Information:",
    items: [
      "This operation will process all AMCs in the system",
      "Only AMCs without existing payments till the specified year will be updated",
      "The process may take a few moments for large datasets",
      "You'll see a detailed summary of the results after completion",
    ],
  },
};

// Utility function to handle API errors
export const handleApiError = (error: any, toast: any) => {
  toast({
    title: TOAST_MESSAGES.error.title,
    description: error.data?.message || TOAST_MESSAGES.error.description,
    variant: TOAST_MESSAGES.error.variant,
  });
};

// Utility function to handle API success
export const handleApiSuccess = (
  response: any,
  isIndividual: boolean,
  setResults: (data: any) => void,
  setShowResults: (show: boolean) => void,
  toast: any
) => {
  if (response.success) {
    setResults(response.data);
    setShowResults(true);
    
    const message = isIndividual
      ? TOAST_MESSAGES.success.individual(response.data.totalNewPaymentsCreated)
      : TOAST_MESSAGES.success.bulk(response.data.totalNewPaymentsCreated, response.data.successfulAmcs);
    
    toast(message);
  } else {
    toast({
      title: TOAST_MESSAGES.error.title,
      description: response.message || TOAST_MESSAGES.error.description,
      variant: TOAST_MESSAGES.error.variant,
    });
  }
}; 