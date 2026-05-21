import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { SchoolAdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSchoolId } from "@/lib/school-hooks";
import { Package, Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, ClipboardList, AlertTriangle, Printer } from "lucide-react";
import { format } from "date-fns";

interface Props { params: { schoolSlug: string } }

interface StockItem {
  id: number; schoolId: number; name: string; category: string; unit: string;
  reorderLevel: number; currentQuantity: number; createdAt: string;
}

interface StockMovement {
  id: number; schoolId: number; itemId: number; type: string; quantity: number;
  reference: string | null; notes: string | null; cost: number | null;
  expenditureId: number | null; date: string; createdBy: number | null; createdAt: string;
}

const CATEGORIES = ["stationery", "feeding", "equipment", "cleaning", "medical", "other"];
const UNITS = ["pieces", "kg", "litres", "boxes", "reams", "rolls", "sets", "bags", "bottles"];
const CATEGORY_COLORS: Record<string, string> = {
  stationery: "bg-blue-100 text-blue-700",
  feeding: "bg-green-100 text-green-700",
  equipment: "bg-purple-100 text-purple-700",
  cleaning: "bg-cyan-100 text-cyan-700",
  medical: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

export default function StockPage({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("catalogue");

  // Catalogue filters
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Movement filters
  const [movItemFilter, setMovItemFilter] = useState("all");
  const [movTypeFilter, setMovTypeFilter] = useState("all");
  const [movDateFrom, setMovDateFrom] = useState("");
  const [movDateTo, setMovDateTo] = useState("");

  // Dialogs
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item?: StockItem }>({ open: false });
  const [moveDialog, setMoveDialog] = useState<{ open: boolean; item?: StockItem }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item?: StockItem }>({ open: false });

  // Item form
  const [itemForm, setItemForm] = useState({ name: "", category: "other", unit: "pieces", reorderLevel: "0", openingStock: "" });

  // Movement form
  const [moveForm, setMoveForm] = useState({ itemId: "", type: "intake", quantity: "", reference: "", notes: "", cost: "", date: format(new Date(), "yyyy-MM-dd") });

  // Stock-take
  const [stocktakeCounts, setStocktakeCounts] = useState<Record<number, string>>({});
  const [stocktakeDate, setStocktakeDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [stocktakeNotes, setStocktakeNotes] = useState("");
  const [stocktakeSubmitting, setStocktakeSubmitting] = useState(false);

  // Report
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [reportData, setReportData] = useState<{ items: StockItem[]; movements: StockMovement[] } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!schoolId) return;
    const res = await fetch(`/api/schools/${schoolId}/stock/items`, { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, [schoolId]);

  const fetchMovements = useCallback(async () => {
    if (!schoolId) return;
    const params = new URLSearchParams();
    if (movItemFilter !== "all") params.set("itemId", movItemFilter);
    if (movTypeFilter !== "all") params.set("type", movTypeFilter);
    if (movDateFrom) params.set("dateFrom", movDateFrom);
    if (movDateTo) params.set("dateTo", movDateTo);
    const res = await fetch(`/api/schools/${schoolId}/stock/movements?${params}`, { credentials: "include" });
    if (res.ok) setMovements(await res.json());
  }, [schoolId, movItemFilter, movTypeFilter, movDateFrom, movDateTo]);

  useEffect(() => {
    Promise.all([fetchItems(), fetchMovements()]).finally(() => setLoading(false));
  }, [fetchItems, fetchMovements]);

  useEffect(() => { if (activeTab === "movements") fetchMovements(); }, [activeTab, fetchMovements]);

  // ── Handlers ────────────────────────────────────────────────

  const openAddItem = () => {
    setItemForm({ name: "", category: "other", unit: "pieces", reorderLevel: "0", openingStock: "" });
    setItemDialog({ open: true });
  };

  const openEditItem = (item: StockItem) => {
    setItemForm({ name: item.name, category: item.category, unit: item.unit, reorderLevel: String(item.reorderLevel), openingStock: "" });
    setItemDialog({ open: true, item });
  };

  const saveItem = async () => {
    if (!itemForm.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const url = itemDialog.item
        ? `/api/schools/${schoolId}/stock/items/${itemDialog.item.id}`
        : `/api/schools/${schoolId}/stock/items`;
      const res = await fetch(url, {
        method: itemDialog.item ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: itemForm.name, category: itemForm.category, unit: itemForm.unit, reorderLevel: Number(itemForm.reorderLevel) }),
      });
      if (!res.ok) { toast({ title: (await res.json()).error, variant: "destructive" }); return; }
      // For new items, record opening stock as an intake movement if provided
      if (!itemDialog.item && itemForm.openingStock && Number(itemForm.openingStock) > 0) {
        const created: StockItem = await res.json();
        await fetch(`/api/schools/${schoolId}/stock/movements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            itemId: created.id,
            type: "intake",
            quantity: Number(itemForm.openingStock),
            reference: "Opening stock",
            date: format(new Date(), "yyyy-MM-dd"),
          }),
        });
      }
      toast({ title: itemDialog.item ? "Item updated" : "Item added" });
      setItemDialog({ open: false });
      await fetchItems();
    } finally { setSubmitting(false); }
  };

  const deleteItem = async () => {
    if (!deleteDialog.item) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/stock/items/${deleteDialog.item.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { toast({ title: (await res.json()).error, variant: "destructive" }); return; }
      toast({ title: "Item deleted" });
      setDeleteDialog({ open: false });
      await fetchItems();
    } finally { setSubmitting(false); }
  };

  const openMoveDialog = (item?: StockItem) => {
    setMoveForm({ itemId: item ? String(item.id) : "", type: "intake", quantity: "", reference: "", notes: "", cost: "", date: format(new Date(), "yyyy-MM-dd") });
    setMoveDialog({ open: true, item });
  };

  const recordMovement = async () => {
    if (!moveForm.itemId || !moveForm.quantity || !moveForm.date) {
      toast({ title: "Item, quantity and date are required", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/stock/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemId: parseInt(moveForm.itemId),
          type: moveForm.type,
          quantity: Number(moveForm.quantity),
          reference: moveForm.reference || undefined,
          notes: moveForm.notes || undefined,
          cost: moveForm.cost ? Number(moveForm.cost) : undefined,
          date: moveForm.date,
        }),
      });
      if (!res.ok) { toast({ title: (await res.json()).error, variant: "destructive" }); return; }
      const result = await res.json();
      const verb = moveForm.type === "intake" ? "Stock received" : moveForm.type === "issue" ? "Stock issued" : "Stock adjusted";
      toast({ title: `${verb} — new balance: ${result.newQuantity}` });
      setMoveDialog({ open: false });
      await fetchItems();
      if (activeTab === "movements") await fetchMovements();
    } finally { setSubmitting(false); }
  };

  const submitStocktake = async () => {
    const counts = Object.entries(stocktakeCounts)
      .filter(([, v]) => v !== "")
      .map(([itemId, physicalCount]) => ({ itemId: parseInt(itemId), physicalCount: Number(physicalCount) }));
    if (counts.length === 0) { toast({ title: "Enter at least one count", variant: "destructive" }); return; }
    setStocktakeSubmitting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/stock/stocktake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ counts, date: stocktakeDate, notes: stocktakeNotes }),
      });
      if (!res.ok) { toast({ title: "Stock-take failed", variant: "destructive" }); return; }
      const { results } = await res.json();
      const changed = results.filter((r: any) => r.adjustment !== 0).length;
      toast({ title: `Stock-take saved — ${changed} item(s) adjusted` });
      setStocktakeCounts({});
      setStocktakeNotes("");
      await fetchItems();
    } finally { setStocktakeSubmitting(false); }
  };

  const loadReport = async () => {
    const params = new URLSearchParams();
    if (reportFrom) params.set("dateFrom", reportFrom);
    if (reportTo) params.set("dateTo", reportTo);
    const res = await fetch(`/api/schools/${schoolId}/stock/report?${params}`, { credentials: "include" });
    if (res.ok) setReportData(await res.json());
  };

  // ── Derived ─────────────────────────────────────────────────

  const filteredItems = items.filter(i =>
    (catFilter === "all" || i.category === catFilter) &&
    (search === "" || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const lowStockItems = items.filter(i => i.reorderLevel > 0 && i.currentQuantity <= i.reorderLevel);

  const getItemName = (id: number) => items.find(i => i.id === id)?.name ?? `#${id}`;

  // ── Render ───────────────────────────────────────────────────

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
            <p className="text-muted-foreground">Track inventory levels, record intake and issues, and reconcile physical counts.</p>
          </div>
          <Button onClick={openAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Low-stock banner */}
        {lowStockItems.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} below reorder level:&nbsp;
              <span className="font-normal">{lowStockItems.map(i => i.name).join(", ")}</span>
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
            <TabsTrigger value="movements">
              Movements
            </TabsTrigger>
            <TabsTrigger value="stocktake">Stock-take</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          {/* ── Catalogue ── */}
          <TabsContent value="catalogue" className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} className="w-52" />
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => openMoveDialog()}>
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Record Movement
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <Package className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">No items found. Add your first stock item to get started.</p>
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">In Stock</TableHead>
                      <TableHead className="text-right">Reorder At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => {
                      const isLow = item.reorderLevel > 0 && item.currentQuantity <= item.reorderLevel;
                      const isOut = item.currentQuantity === 0;
                      return (
                        <TableRow key={item.id} className={isOut ? "bg-red-50/50" : isLow ? "bg-amber-50/50" : ""}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other}`}>
                              {item.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{item.unit}</TableCell>
                          <TableCell className={`text-right font-bold tabular-nums ${isOut ? "text-red-600" : isLow ? "text-amber-600" : ""}`}>
                            {item.currentQuantity}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground tabular-nums text-sm">{item.reorderLevel || "—"}</TableCell>
                          <TableCell>
                            {isOut ? (
                              <Badge variant="destructive" className="text-xs">Out of stock</Badge>
                            ) : isLow ? (
                              <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Low stock</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="icon" variant="ghost" className="h-8 w-8" title="Record movement" onClick={() => openMoveDialog(item)}>
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEditItem(item)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteDialog({ open: true, item })}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* ── Movements ── */}
          <TabsContent value="movements" className="space-y-4">
            <div className="flex gap-3 flex-wrap items-end">
              <div className="space-y-1">
                <Label className="text-xs">Item</Label>
                <Select value={movItemFilter} onValueChange={setMovItemFilter}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All items</SelectItem>
                    {items.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={movTypeFilter} onValueChange={setMovTypeFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={movDateFrom} onChange={e => setMovDateFrom(e.target.value)} className="w-36" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={movDateTo} onChange={e => setMovDateTo(e.target.value)} className="w-36" />
              </div>
              <Button variant="outline" onClick={fetchMovements}>Apply</Button>
            </div>

            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No movements found for the selected filters.</p>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Cost (GHS)</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm tabular-nums">{m.date}</TableCell>
                        <TableCell className="font-medium">{getItemName(m.itemId)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.type === "intake" ? "bg-green-100 text-green-700" :
                            m.type === "issue" ? "bg-blue-100 text-blue-700" :
                            "bg-purple-100 text-purple-700"
                          }`}>
                            {m.type === "intake" ? "▲ Intake" : m.type === "issue" ? "▼ Issue" : "↔ Adjust"}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${m.type === "issue" ? "text-blue-600" : m.type === "intake" ? "text-green-600" : "text-purple-600"}`}>
                          {m.type === "issue" ? "−" : m.type === "intake" ? "+" : "↔"}{m.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.reference ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm">{m.cost ? m.cost.toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{m.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* ── Stock-take ── */}
          <TabsContent value="stocktake" className="space-y-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="space-y-1">
                <Label>Stock-take Date</Label>
                <Input type="date" value={stocktakeDate} onChange={e => setStocktakeDate(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-1 flex-1 min-w-48">
                <Label>Notes (optional)</Label>
                <Input placeholder="e.g. End-of-term count" value={stocktakeNotes} onChange={e => setStocktakeNotes(e.target.value)} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Enter the physical count for each item. Leave blank to skip. Items with discrepancies will be auto-adjusted.</p>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No items in catalogue yet.</p>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">System Balance</TableHead>
                      <TableHead className="w-40">Physical Count</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => {
                      const counted = stocktakeCounts[item.id] !== undefined ? Number(stocktakeCounts[item.id]) : null;
                      const diff = counted !== null ? counted - item.currentQuantity : null;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other}`}>
                              {item.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{item.currentQuantity} {item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              placeholder="—"
                              value={stocktakeCounts[item.id] ?? ""}
                              onChange={e => setStocktakeCounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="h-8 w-28"
                            />
                          </TableCell>
                          <TableCell className={`text-right font-semibold tabular-nums text-sm ${diff === null ? "text-muted-foreground" : diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                            {diff === null ? "—" : diff === 0 ? "No change" : `${diff > 0 ? "+" : ""}${diff}`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
            <div className="flex justify-end">
              <Button onClick={submitStocktake} disabled={stocktakeSubmitting || Object.keys(stocktakeCounts).length === 0}>
                <ClipboardList className="w-4 h-4 mr-2" />
                {stocktakeSubmitting ? "Saving…" : "Submit Stock-take"}
              </Button>
            </div>
          </TabsContent>

          {/* ── Report ── */}
          <TabsContent value="report" className="space-y-4">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="w-36" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="w-36" />
              </div>
              <Button onClick={loadReport}>Generate Report</Button>
              {reportData && (
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              )}
            </div>

            {reportData && (
              <div className="space-y-6 print:space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-3">Current Stock Balances</h2>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead className="text-right">Reorder Level</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.items.map(item => {
                          const isLow = item.reorderLevel > 0 && item.currentQuantity <= item.reorderLevel;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-sm capitalize">{item.category}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                              <TableCell className={`text-right font-semibold tabular-nums ${isLow ? "text-amber-600" : ""}`}>{item.currentQuantity}</TableCell>
                              <TableCell className="text-right text-muted-foreground text-sm tabular-nums">{item.reorderLevel || "—"}</TableCell>
                              <TableCell>{isLow ? <Badge className="text-xs bg-amber-100 text-amber-700">Low</Badge> : <Badge variant="outline" className="text-xs text-green-600">OK</Badge>}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </div>

                {reportData.movements.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">
                      Movements {reportFrom || reportTo ? `(${reportFrom || "all"} → ${reportTo || "now"})` : "(All time)"}
                    </h2>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Cost (GHS)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.movements.map(m => (
                            <TableRow key={m.id}>
                              <TableCell className="text-sm">{m.date}</TableCell>
                              <TableCell>{reportData.items.find(i => i.id === m.itemId)?.name ?? `#${m.itemId}`}</TableCell>
                              <TableCell className="capitalize text-sm">{m.type}</TableCell>
                              <TableCell className="text-right tabular-nums">{m.quantity}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{m.reference ?? "—"}</TableCell>
                              <TableCell className="text-right text-sm">{m.cost ? m.cost.toLocaleString() : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add / Edit Item Dialog ── */}
      <Dialog open={itemDialog.open} onOpenChange={open => setItemDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemDialog.item ? "Edit Item" : "Add Stock Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. A4 Paper Ream" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={itemForm.unit} onValueChange={v => setItemForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reorder Level <span className="text-muted-foreground text-xs">(alert when stock falls to or below this)</span></Label>
              <Input type="number" min="0" value={itemForm.reorderLevel} onChange={e => setItemForm(f => ({ ...f, reorderLevel: e.target.value }))} />
            </div>
            {!itemDialog.item && (
              <div className="space-y-1.5">
                <Label>Opening Stock <span className="text-muted-foreground text-xs">(current quantity on hand)</span></Label>
                <Input type="number" min="0" placeholder="0" value={itemForm.openingStock} onChange={e => setItemForm(f => ({ ...f, openingStock: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog({ open: false })}>Cancel</Button>
            <Button onClick={saveItem} disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Record Movement Dialog ── */}
      <Dialog open={moveDialog.open} onOpenChange={open => setMoveDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Item *</Label>
              <Select value={moveForm.itemId} onValueChange={v => setMoveForm(f => ({ ...f, itemId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select item…" /></SelectTrigger>
                <SelectContent>
                  {items.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name} ({i.currentQuantity} {i.unit})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={moveForm.type} onValueChange={v => setMoveForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intake">▲ Intake (add stock)</SelectItem>
                    <SelectItem value="issue">▼ Issue (remove stock)</SelectItem>
                    <SelectItem value="adjustment">↔ Adjustment (set absolute)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {moveForm.type === "adjustment" ? "New quantity *" : "Quantity *"}
                </Label>
                <Input type="number" min="0" value={moveForm.quantity} onChange={e => setMoveForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={moveForm.date} onChange={e => setMoveForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              {moveForm.type === "intake" && (
                <div className="space-y-1.5">
                  <Label>Cost (GHS) <span className="text-muted-foreground text-xs">— auto-creates expenditure</span></Label>
                  <Input type="number" min="0" step="0.01" value={moveForm.cost} onChange={e => setMoveForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{moveForm.type === "intake" ? "Supplier / Source" : "Recipient / Purpose"}</Label>
              <Input value={moveForm.reference} onChange={e => setMoveForm(f => ({ ...f, reference: e.target.value }))} placeholder={moveForm.type === "intake" ? "e.g. Accra Stationery Ltd" : "e.g. Class 6A"} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={moveForm.notes} onChange={e => setMoveForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog({ open: false })}>Cancel</Button>
            <Button onClick={recordMovement} disabled={submitting}>{submitting ? "Saving…" : "Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleteDialog.item?.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This item will be permanently removed. Items with movement history cannot be deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={deleteItem} disabled={submitting}>{submitting ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolAdminLayout>
  );
}
