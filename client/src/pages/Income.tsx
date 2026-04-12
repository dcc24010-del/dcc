import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useIncomes, useCreateIncome, useDeleteIncome, useBatches, useStudents } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Filter, Calendar as CalendarIcon, CheckCircle, History as HistoryIcon, MessageCircle, FileDown, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildPaymentWhatsAppUrl } from "@/lib/whatsapp";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertIncomeSchema, type Income as IncomeType, type Batch, type Student } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formSchema = insertIncomeSchema.extend({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  batchId: z.coerce.number().min(1, "Select a batch"),
  studentId: z.coerce.number().min(1, "Select a student"),
});

type IncomeWithRelations = IncomeType & {
  student?: Student;
  batch?: Batch;
  addedBy?: string;
};

function StudentCombobox({
  value,
  onChange,
  students,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  students: any[];
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = students.find((s) => s.id.toString() === value);
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.studentCustomId ?? "").toLowerCase().includes(query.toLowerCase())
  );

  function closeDropdown() {
    setOpen(false);
    setQuery("");
  }

  function openDropdown() {
    setOpen(true);
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 50);
  }

  return (
    <div className="relative">
      {/* Transparent overlay — covers everything behind the dropdown; tap it to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onPointerDown={closeDropdown}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        disabled={disabled}
        data-testid="button-student-combobox"
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          if (open) closeDropdown();
          else openDropdown();
        }}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected
            ? `${selected.name} (${selected.studentCustomId})`
            : disabled
            ? "Select batch first"
            : "Select a student"}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="p-2 border-b border-border/50">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Student ID or Name..."
              data-testid="input-student-search"
              className="w-full h-8 px-2 text-xs rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="max-h-[35vh] overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No students found.
              </div>
            ) : (
              filtered.map((student) => (
                <div
                  key={student.id}
                  data-testid={`option-student-${student.id}`}
                  className={`flex items-center px-3 py-2.5 text-sm cursor-pointer select-none hover:bg-accent hover:text-accent-foreground ${
                    value === student.id.toString() ? "bg-accent/50 font-medium" : ""
                  }`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onChange(student.id.toString());
                    closeDropdown();
                  }}
                >
                  {student.name} ({student.studentCustomId})
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Income() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const [open, setOpen] = useState(false);
  const { data: incomes, isLoading } = useIncomes();
  const { data: batches } = useBatches();
  const { data: students } = useStudents();
  
  const createMutation = useCreateIncome();
  const deleteMutation = useDeleteIncome();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const isTeacherRole = user?.role === "teacher";
  const { data: myCollection, refetch: refetchMyCollection } = useQuery<{ amount: number; lastUpdated: string | null }>({
    queryKey: ["/api/collections/me"],
    enabled: isTeacherRole,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: 0,
      batchId: 0,
      month: MONTHS[new Date().getMonth()],
      amount: 0,
    },
  });

  const selectedBatchId = form.watch("batchId");
  const filteredStudents = ((students as any[])?.filter(s => s.batchId === Number(selectedBatchId)) || []).sort((a: any, b: any) => {
    if (!a.studentCustomId && !b.studentCustomId) return 0;
    if (!a.studentCustomId) return 1;
    if (!b.studentCustomId) return -1;
    return a.studentCustomId.localeCompare(b.studentCustomId, undefined, { numeric: true });
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/incomes/${id}/status`, { status: "Verified" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      toast({
        title: "Payment Verified",
        description: "The payment has been marked as verified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    form.setValue("studentId", 0);
  }, [selectedBatchId, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({
          title: "Payment added",
          description: "Payment recorded successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/collections/me"] });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      },
    });
  }

  function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this record?")) {
        deleteMutation.mutate(id, {
            onSuccess: () => {
                toast({ title: "Record deleted" });
            }
        });
    }
  }

  function downloadMonthPdf(batchName: string, monthName: string, records: IncomeWithRelations[]) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 80);
    doc.text("Dynamic Coaching Center", pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 120);
    doc.text("Monthly Payment Statement", pageWidth / 2, 25, { align: "center" });

    // Subtitle: Class + Month
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`Class: ${batchName}   |   Month: ${monthName}`, pageWidth / 2, 33, { align: "center" });

    // Horizontal rule
    doc.setDrawColor(180, 180, 220);
    doc.setLineWidth(0.4);
    doc.line(14, 37, pageWidth - 14, 37);

    // Sort records by studentCustomId ascending
    const sorted = [...records].sort((a, b) => {
      const idA = (a.student as any)?.studentCustomId ?? "";
      const idB = (b.student as any)?.studentCustomId ?? "";
      return idA.localeCompare(idB, undefined, { numeric: true });
    });

    const totalCollection = sorted.reduce((sum, r) => sum + Number(r.amount), 0);

    // Table
    autoTable(doc, {
      startY: 41,
      head: [["Student Name", "Student ID", "Amount (Tk)", "Payment Date", "Added By"]],
      body: sorted.map((inc) => [
        (inc.student as any)?.name ?? "—",
        (inc.student as any)?.studentCustomId ?? "—",
        `Tk ${Number(inc.amount).toLocaleString()}`,
        inc.date ? format(new Date(inc.date), "MMM d, yyyy") : "—",
        inc.addedBy ?? "—",
      ]),
      foot: [["", "", `Total: Tk ${totalCollection.toLocaleString()}`, "", ""]],
      headStyles: {
        fillColor: [63, 63, 160],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
        halign: "left",
      },
      footStyles: {
        fillColor: [230, 230, 245],
        textColor: [40, 40, 80],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 26, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 32, halign: "center" },
        4: { cellWidth: 46 },
      },
      margin: { left: 14, right: 14 },
      tableLineColor: [200, 200, 220],
      tableLineWidth: 0.2,
    });

    // Footer note
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${format(new Date(), "PPpp")} — Dynamic Coaching Center`,
      pageWidth / 2,
      finalY,
      { align: "center" }
    );

    doc.save(`DCC_Payment_${batchName}_${monthName}.pdf`);
  }

  const filteredIncomes = (incomes as IncomeWithRelations[])?.filter(inc => 
    inc.student?.name.toLowerCase().includes(search.toLowerCase()) || 
    inc.batch?.name.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  if (user?.role === "student") {
    return (
      <Layout title="Payments" subtitle="View your payment history">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <HistoryIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Personal History Only</h2>
          <p className="text-slate-500 max-w-md mt-2">
            Students can only view their own payment history from the Dashboard. You do not have permission to record or manage payments.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
        title="Payment Records" 
        subtitle="Manage tuition payments and income sources"
        action={
            isTeacher && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg hover:shadow-xl transition-all">
                            <Plus className="w-4 h-4 mr-2" /> Add Payment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Payment</DialogTitle>
                            <DialogDescription>
                                Record a tuition payment from a student.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="batchId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Batch</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a batch" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {(batches as any[])?.map((batch) => (
                                                        <SelectItem key={batch.id} value={batch.id.toString()}>{batch.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="studentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Student</FormLabel>
                                            <FormControl>
                                                <StudentCombobox
                                                    value={field.value?.toString() ?? ""}
                                                    onChange={field.onChange}
                                                    students={filteredStudents}
                                                    disabled={!selectedBatchId}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="month"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Month</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a month" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {MONTHS.map((month) => (
                                                        <SelectItem key={month} value={month}>{month}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount (৳)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-3 h-3" />
                                        <span>Recorded by: {user?.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>Recorded date will be set to: {format(new Date(), "PPpp")}</span>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Adding..." : "Add Record"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            )
        }
    >
        <div className="space-y-4">
            {/* Teacher: My Current Collection box */}
            {isTeacherRole && (
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-5 flex items-center justify-between shadow-lg text-white">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-100 mb-0.5">My Current Collection</p>
                        <p className="text-3xl font-bold tracking-tight" data-testid="text-my-collection">
                            ৳{(myCollection?.amount ?? 0).toLocaleString()}
                        </p>
                        {myCollection?.lastUpdated && (
                            <p className="text-[11px] text-indigo-200 mt-1">
                                Last updated: {format(new Date(myCollection.lastUpdated), "MMM d, h:mm a")}
                            </p>
                        )}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.171-.879-1.171-2.303 0-3.182.53-.398 1.21-.597 1.925-.596m.353 5.435V17m0-10.435V7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Search bar */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search student or batch..."
                            className="pl-9 bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="w-4 h-4" />
                        <span>{filteredIncomes?.length || 0} records found</span>
                    </div>
                </div>
            </div>

            {/* Class → Month double-nested accordion */}
            {isLoading ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center text-muted-foreground">
                    Loading...
                </div>
            ) : !filteredIncomes || filteredIncomes.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center text-muted-foreground">
                    No records found.
                </div>
            ) : (() => {
                // Group by batchId
                const groups: Record<number, { batchName: string; records: IncomeWithRelations[] }> = {};
                filteredIncomes.forEach((inc: any) => {
                    const bId = inc.batchId as number;
                    if (!groups[bId]) groups[bId] = { batchName: inc.batch?.name ?? `Batch ${bId}`, records: [] };
                    groups[bId].records.push(inc);
                });
                const groupEntries = Object.entries(groups);
                return (
                    <Accordion type="multiple" defaultValue={[]} className="space-y-3">
                        {groupEntries.map(([batchId, { batchName, records }]) => {
                            // Group records within this batch by month, sorted by calendar order
                            const monthGroups: Record<string, IncomeWithRelations[]> = {};
                            records.forEach((inc: any) => {
                                const m = inc.month as string;
                                if (!monthGroups[m]) monthGroups[m] = [];
                                monthGroups[m].push(inc);
                            });
                            const sortedMonths = MONTHS.filter(m => monthGroups[m]);
                            return (
                                <AccordionItem
                                    key={batchId}
                                    value={batchId}
                                    className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
                                >
                                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-base text-foreground">{batchName}</span>
                                            <Badge variant="secondary" className="text-xs font-semibold">
                                                {records.length} record{records.length !== 1 ? "s" : ""}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0">
                                        {/* Month-level inner accordion */}
                                        <Accordion type="multiple" defaultValue={[]} className="px-4 py-3 space-y-2">
                                            {sortedMonths.map((monthName) => {
                                                const monthRecords = monthGroups[monthName];
                                                const monthKey = `${batchId}-${monthName}`;
                                                const pendingCount = monthRecords.filter((r: any) => r.status === 'Pending').length;
                                                const verifiedCount = monthRecords.filter((r: any) => r.status === 'Verified').length;
                                                return (
                                                    <AccordionItem
                                                        key={monthKey}
                                                        value={monthKey}
                                                        className="border border-border/60 rounded-xl overflow-hidden bg-background"
                                                    >
                                                        <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-primary/5 [&[data-state=open]]:bg-primary/5">
                                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                                <span className="font-semibold text-sm text-primary">{monthName}</span>
                                                                <Badge variant="outline" className="text-xs border-primary/30 text-primary/70 font-medium">
                                                                    {monthRecords.length} student{monthRecords.length !== 1 ? "s" : ""}
                                                                </Badge>
                                                                {pendingCount > 0 && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                                        {pendingCount} pending
                                                                    </span>
                                                                )}
                                                                {verifiedCount > 0 && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                        <CheckCircle className="w-2.5 h-2.5" />
                                                                        {verifiedCount} verified
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="p-0">
                                                            <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-b border-border/40">
                                                                <span className="text-xs font-semibold text-muted-foreground">
                                                                    Total Collection: <span className="text-emerald-600">৳{monthRecords.reduce((sum, r: any) => sum + Number(r.amount), 0).toLocaleString()}</span>
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                                                    onClick={() => downloadMonthPdf(batchName, monthName, monthRecords)}
                                                                    data-testid={`button-download-pdf-${batchId}-${monthName}`}
                                                                >
                                                                    <FileDown className="w-3.5 h-3.5" />
                                                                    Download PDF
                                                                </Button>
                                                            </div>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="hover:bg-transparent">
                                                                        <TableHead>Student Name</TableHead>
                                                                        {isAdmin && <TableHead>Added By</TableHead>}
                                                                        <TableHead>Date</TableHead>
                                                                        <TableHead className="text-right">Amount</TableHead>
                                                                        <TableHead className="w-[90px]"></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {monthRecords.map((inc: any) => (
                                                                        <TableRow
                                                                            key={inc.id}
                                                                            className={`group transition-colors ${
                                                                                inc.status === 'Pending'
                                                                                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                                                                    : inc.status === 'Verified'
                                                                                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                                                                    : 'hover:bg-muted/30'
                                                                            }`}
                                                                        >
                                                                            <TableCell className="font-medium">
                                                                                <div className="flex items-center gap-2">
                                                                                    {inc.student?.name}
                                                                                    {inc.status === 'Pending' && (
                                                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pending</span>
                                                                                    )}
                                                                                    {inc.status === 'Verified' && (
                                                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                                            <CheckCircle className="w-2.5 h-2.5" />
                                                                                            Verified
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                            {isAdmin && <TableCell className="text-muted-foreground text-sm">{inc.addedBy || "N/A"}</TableCell>}
                                                                            <TableCell className="text-muted-foreground text-sm">{format(new Date(inc.date), "MMM d, y")}</TableCell>
                                                                            <TableCell className="text-right font-medium text-emerald-600">
                                                                                <div className="flex items-center justify-end gap-3">
                                                                                    +৳{inc.amount.toLocaleString()}
                                                                                    {isAdmin && inc.status === 'Pending' && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            className="h-7 text-[10px] bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white"
                                                                                            onClick={() => verifyMutation.mutate(inc.id)}
                                                                                            disabled={verifyMutation.isPending}
                                                                                        >
                                                                                            {verifyMutation.isPending ? "..." : "Verify"}
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100">
                                                                                    {isAdmin && inc.student?.mobileNumber && (() => {
                                                                                        const url = buildPaymentWhatsAppUrl(
                                                                                            inc.student.mobileNumber,
                                                                                            inc.amount,
                                                                                            inc.student.name,
                                                                                            inc.month
                                                                                        );
                                                                                        return url ? (
                                                                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                                                                <Button variant="ghost" size="icon" className="text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]">
                                                                                                    <MessageCircle className="w-4 h-4" />
                                                                                                </Button>
                                                                                            </a>
                                                                                        ) : null;
                                                                                    })()}
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="text-destructive"
                                                                                        onClick={() => handleDelete(inc.id)}
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                );
            })()}
        </div>
    </Layout>
  );
}
