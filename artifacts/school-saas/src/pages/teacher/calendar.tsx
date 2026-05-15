import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, parseISO,
} from "date-fns";

interface CalEvent {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  category: string;
}

const CATEGORIES = [
  { value: "academic", label: "Academic", light: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  { value: "event", label: "Event", light: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  { value: "exams", label: "Exams", light: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  { value: "meeting", label: "Meeting", light: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-400" },
  { value: "holiday", label: "Holiday", light: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
];

function getCat(cat: string) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[0];
}

export default function TeacherCalendar() {
  const [, navigate] = useLocation();
  const [viewDate, setViewDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const monthStr = format(viewDate, "yyyy-MM");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/teacher/calendar?month=${monthStr}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setEvents(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monthStr]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  function eventsForDay(day: Date): CalEvent[] {
    const d = format(day, "yyyy-MM-dd");
    return events.filter(ev => d >= ev.startDate && d <= ev.endDate);
  }

  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate("/teacher/dashboard")}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h1 className="font-semibold">School Calendar</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(d => subMonths(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[120px] text-center">
            {format(viewDate, "MMMM yyyy")}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(d => addMonths(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setViewDate(new Date())}>Today</Button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">

        {/* Legend */}
        <div className="flex flex-wrap gap-3 py-1">
          {CATEGORIES.map(c => (
            <div key={c.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              {c.label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-slate-50">
            {DAY_HEADERS.map(d => (
              <div key={d} className="py-2 text-[11px] font-semibold text-muted-foreground text-center border-r last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calDays.map((day, i) => {
              const dayEvents = eventsForDay(day);
              const inMonth = isSameMonth(day, viewDate);
              const todayCell = isToday(day);
              const dayStr = format(day, "yyyy-MM-dd");
              const visible = dayEvents.slice(0, 3);
              const overflow = dayEvents.length - 3;
              return (
                <div
                  key={i}
                  className={`min-h-[80px] border-b border-r last:border-r-0 p-1
                    ${inMonth ? "bg-white" : "bg-slate-50/60"}
                  `}
                >
                  <div className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-0.5
                    ${todayCell ? "bg-primary text-white" : inMonth ? "text-foreground" : "text-muted-foreground/40"}
                  `}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {visible.map(ev => {
                      const cat = getCat(ev.category);
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded font-medium truncate border ${cat.light}`}
                        >
                          {ev.title}
                        </button>
                      );
                    })}
                    {overflow > 0 && (
                      <div className="text-[10px] text-muted-foreground px-1 font-medium">+{overflow} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events list (below calendar) */}
        {events.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b">
              <p className="text-sm font-semibold">Events This Month</p>
            </div>
            <div className="divide-y">
              {events
                .filter((ev, i, arr) => arr.findIndex(e => e.id === ev.id) === i)
                .map(ev => {
                  const cat = getCat(ev.category);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cat.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ev.startDate === ev.endDate
                            ? format(parseISO(ev.startDate + "T12:00:00"), "MMM d, yyyy")
                            : `${format(parseISO(ev.startDate + "T12:00:00"), "MMM d")} – ${format(parseISO(ev.endDate + "T12:00:00"), "MMM d, yyyy")}`
                          }
                          {ev.startTime ? ` · ${ev.startTime}` : ""}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cat.light}`}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No events for {format(viewDate, "MMMM yyyy")}</p>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getCat(selectedEvent.category).dot}`} />
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getCat(selectedEvent.category).light}`}>
                {getCat(selectedEvent.category).label}
              </span>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Date: </span>
                {selectedEvent.startDate === selectedEvent.endDate
                  ? format(parseISO(selectedEvent.startDate + "T12:00:00"), "EEEE, MMMM d, yyyy")
                  : `${format(parseISO(selectedEvent.startDate + "T12:00:00"), "MMM d")} – ${format(parseISO(selectedEvent.endDate + "T12:00:00"), "MMM d, yyyy")}`
                }
                {selectedEvent.startTime && (
                  <span> · {selectedEvent.startTime}{selectedEvent.endTime ? ` – ${selectedEvent.endTime}` : ""}</span>
                )}
              </div>
              {selectedEvent.description && (
                <p className="text-muted-foreground bg-slate-50 rounded-lg p-3 leading-relaxed">
                  {selectedEvent.description}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button size="sm" onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
