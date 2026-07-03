import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, AlertTriangle, IndianRupee, Mail } from 'lucide-react'
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Contact {
    name: string;
    email: string;
    phone: string;
    designation: string;
}

interface AMCDetailsProps {
    clientName: string
    productName: string
    amcCycle: string
    amcAmount: string
    amcDueDate: string
    overduedays?: number
    upcomingDays?: number
    contacts: Contact[]
    type: "pending" | "upcoming" | "agreement-end"
    amcLink: string
    clientId: string
    showContacts?: boolean
    reminderId?: string
}

export const SendEmailButton = ({ reminderId, emailIndex, text }: { reminderId: string, emailIndex: number, text: string }) => {
    const router = useRouter()
    return <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => router.push(`/reminders/email/${reminderId}?emailIndex=${emailIndex}`)}
    >
        <Mail className="mr-2 h-4 w-4" />
        {text}
    </Button>
}

export default function ReminderAMCDetail({
    clientName,
    productName,
    amcCycle,
    amcAmount,
    amcDueDate,
    overduedays,
    upcomingDays,
    contacts,
    type = "pending",
    amcLink,
    clientId,
    reminderId,
    showContacts = true
}: AMCDetailsProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(parseFloat(amount))
    }

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    {
                        type === "pending" ? (
                            <>
                                <CardTitle>Pending AMC Details</CardTitle>
                                <Badge variant="destructive" className="text-sm">
                                    {overduedays} days overdue
                                </Badge>
                            </>
                        ) :
                            type === "upcoming" ? (
                                <>
                                    <CardTitle>Upcoming AMC Details</CardTitle>
                                    <Badge variant="secondary" className="text-sm">
                                        {upcomingDays} days left
                                    </Badge>
                                </>
                            ) : (
                                <Badge variant="secondary" className="text-sm">
                                    AMC Agreement Ended
                                </Badge>
                            )
                    }
                </div>
                <CardDescription>Annual Maintenance Contract Information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                        <p className="text-lg font-semibold">{clientName}</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
                        <p className="text-lg font-semibold">{productName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">AMC Cycle</h3>
                            <p>{amcCycle}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <IndianRupee className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Amount Due</h3>
                            <p>{formatCurrency(amcAmount)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                            <p>{formatDate(amcDueDate)}</p>
                        </div>
                    </div>
                </div>

                {
                    showContacts && (
                        <>
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                                {contacts.map((contact, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start mb-4 pb-4 border-b last:border-b-0 px-2">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Name</p>
                                            <p className="text-sm break-words">{contact.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="text-sm break-words">{contact.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Phone</p>
                                            <p className="text-sm break-words">{contact.phone}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Designation</p>
                                            <p className="text-sm break-words">{contact.designation}</p>
                                        </div>
                                        <div>
                                            <SendEmailButton reminderId={reminderId || ""} emailIndex={index} text="Send Email" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-6">
                                <Link href={amcLink} target="_blank" rel="noopener noreferrer" passHref>
                                    <Button >
                                        View AMC Details
                                    </Button>
                                </Link>
                                <Link href={clientId} target="_blank" rel="noopener noreferrer" passHref>
                                    <Button >
                                        View Client Detail
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )
                }
            </CardContent>
        </Card>
    )
}

