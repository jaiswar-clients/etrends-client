import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { INFO_BOX_CONTENT } from "./amcPaymentUtils";

// Shared Info Box Component
interface InfoBoxProps {
  isIndividual?: boolean;
}

export const InfoBox = ({ isIndividual = false }: InfoBoxProps) => {
  const content = isIndividual ? INFO_BOX_CONTENT.individual : INFO_BOX_CONTENT.bulk;
  
  return (
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            {content.title}
          </div>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-xs">
            {content.items.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Individual AMC Results Display
interface IndividualResultsDisplayProps {
  data: any;
}

export const IndividualResultsDisplay = ({ data }: IndividualResultsDisplayProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{data.totalNewPaymentsCreated}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Till Year</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.tillYear}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium text-green-600">
            {data.successfulAmcs > 0 ? "Success" : "No Changes Needed"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.results?.[0]?.totalPayments || 0}
          </div>
        </CardContent>
      </Card>
    </div>

    {data.results && data.results.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">AMC Details:</h4>
        {data.results.map((result: any, index: number) => (
          <div key={index} className="p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                AMC ID: {result.amcId.slice(-8)}
              </div>
              <Badge variant={result.success ? "default" : "secondary"}>
                {result.success ? "Updated" : "No Changes"}
              </Badge>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>Start Date: {new Date(result.amcStartDate).toLocaleDateString()}</div>
              {result.lastAmcPayment && (
                <div>
                  Last Payment: {new Date(result.lastAmcPayment.from_date).toLocaleDateString()} - {new Date(result.lastAmcPayment.to_date).toLocaleDateString()}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {result.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Bulk AMC Results Display
interface BulkResultsDisplayProps {
  data: any;
}

export const BulkResultsDisplay = ({ data }: BulkResultsDisplayProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total AMCs</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalAmcsProcessed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Successful</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{data.successfulAmcs}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{data.failedAmcs}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalNewPaymentsCreated}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Till Year</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.tillYear}</div>
        </CardContent>
      </Card>
    </div>

    {data.results && data.results.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recent Results Sample:</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {data.results.slice(0, 5).map((result: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">
                <div className="font-medium">AMC ID: {result.amcId.slice(-8)}</div>
                <div className="text-xs text-muted-foreground">{result.message}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Success" : "Failed"}
                </Badge>
                <span className="text-xs">+{result.newPaymentsCreated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Success Header Component
interface SuccessHeaderProps {
  title: string;
  description: string;
}

export const SuccessHeader = ({ title, description }: SuccessHeaderProps) => (
  <div className="text-center">
    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
); 