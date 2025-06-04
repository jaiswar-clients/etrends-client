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
import { Badge } from "@/components/ui/badge";
import { useCreateAmcPaymentsByAmcIdMutation } from "@/redux/api/order";
import { toast } from "@/hooks/use-toast";
import { CreditCard, User } from "lucide-react";
import { 
  amcPaymentFormSchema, 
  AmcPaymentFormValues, 
  DEFAULT_FORM_VALUES,
  handleApiError,
  handleApiSuccess 
} from "./shared/amcPaymentUtils";
import { InfoBox, IndividualResultsDisplay, SuccessHeader } from "./shared/AmcPaymentComponents";

interface CreateAmcPaymentsIndividualDialogProps {
  amcId: string;
  clientName?: string;
  children?: React.ReactNode;
}

export default function CreateAmcPaymentsIndividualDialog({ 
  amcId, 
  clientName,
  children 
}: CreateAmcPaymentsIndividualDialogProps) {
  const [open, setOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [createAmcPayments, { isLoading }] = useCreateAmcPaymentsByAmcIdMutation();

  const form = useForm<AmcPaymentFormValues>({
    resolver: zodResolver(amcPaymentFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const onSubmit = async (values: AmcPaymentFormValues) => {
    try {
      const response = await createAmcPayments({ 
        id: amcId, 
        till_year: values.till_year 
      }).unwrap();
      
      handleApiSuccess(response, true, setResults, setShowResults, toast);
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
          <Button variant="outline" size="sm" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Create Payments
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create AMC Payments
            {clientName && (
              <Badge variant="outline" className="ml-2">
                <User className="h-3 w-3 mr-1" />
                {clientName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Create payment schedules for this AMC till the specified year. The system will generate 
            payments for periods that don't already have payment records.
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
                      Enter the year till which you want to create payment schedules for this AMC. 
                      Only missing payment periods will be created.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <InfoBox isIndividual={true} />

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
              title="Operation Completed!"
              description="Here's a summary of what was processed:"
            />
            
            <IndividualResultsDisplay data={results} />

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