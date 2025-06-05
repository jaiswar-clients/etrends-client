"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateAmcPaymentsForAllAmcsMutation } from "@/redux/api/order";
import { toast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";
import { 
  amcPaymentFormSchema, 
  AmcPaymentFormValues, 
  DEFAULT_FORM_VALUES,
  handleApiError,
  handleApiSuccess 
} from "./shared/amcPaymentUtils";
import { InfoBox, BulkResultsDisplay, SuccessHeader } from "./shared/AmcPaymentComponents";

interface CreateAmcPaymentsDialogProps {
  children?: React.ReactNode;
}

export default function CreateAmcPaymentsDialog({ children }: CreateAmcPaymentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [createAmcPayments, { isLoading }] = useCreateAmcPaymentsForAllAmcsMutation();

  const form = useForm<AmcPaymentFormValues>({
    resolver: zodResolver(amcPaymentFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const onSubmit = async (values: AmcPaymentFormValues) => {
    try {
      const response = await createAmcPayments(values).unwrap();
      handleApiSuccess(response, false, setResults, setShowResults, toast);
    } catch (error: any) {
      handleApiError(error, toast);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setShowResults(false);
    setResults(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Create AMC Payments
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create AMC Payments
          </DialogTitle>
          <DialogDescription>
            Create AMC payments for all AMCs till the specified year. This will generate payment schedules 
            for all active AMCs that don&apos;t already have payments extending to the target year.
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="till_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Till Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter year (e.g., 2027)"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the year till which you want to create AMC payments. 
                      The system will create payments for all AMCs that don&apos;t already have 
                      payments extending to this year.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <InfoBox />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Payments"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <SuccessHeader
              title="AMC Payments Created Successfully!"
              description="Here's a summary of the operation:"
            />
            
            <BulkResultsDisplay data={results} />

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 