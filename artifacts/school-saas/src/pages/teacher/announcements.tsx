import { useState, useEffect } from "react";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, ArrowLeft, CheckCheck, Bell } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: number;
  title: string;
  message: string;
  imageUrl: string | null;
  target: string;
  createdAt: string;
  isRead: boolean;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return format(new Date(ts), "MMM d, yyyy");
}

export default function TeacherAnnouncements() {
  const { session } = useTeacherAuth();
  const [, navigate] = useLocation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/teacher/announcements", { credentials: "include" })
      .then(r => r.json())
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/teacher/announcements/${id}/read`, { method: "POST", credentials: "include" });
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const unreadCount = announcements.filter(a => !a.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/dashboard")} className="gap-1 shrink-0">
            <ArrowLeft className="w-4 h-4" />Back
          </Button>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">Announcements</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadCount}</span>
            )}
          </div>
          <div className="ml-auto text-xs text-muted-foreground">{session?.school?.name}</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading announcements…</p>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No announcements yet.</p>
            <p className="text-sm text-muted-foreground">Your school admin will post updates here.</p>
          </div>
        ) : (
          announcements.map(a => (
            <Card
              key={a.id}
              className={`transition-all cursor-pointer hover:shadow-sm ${!a.isRead ? "border-primary/40 bg-primary/[0.02]" : ""}`}
              onClick={() => !a.isRead && markRead(a.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!a.isRead ? "bg-primary" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`font-semibold text-sm ${!a.isRead ? "text-foreground" : "text-muted-foreground"}`}>{a.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{a.message}</p>
                    {!a.isRead && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead(a.id); }}
                        className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <CheckCheck className="w-3 h-3" />Mark as read
                      </button>
                    )}
                    {a.isRead && (
                      <p className="mt-1.5 text-xs text-muted-foreground/50 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" />Read
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
      <footer className="flex items-center justify-center gap-2 py-3">
        <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-light.png`} alt="Torrential Technologies" className="h-4 w-auto object-contain opacity-50" />
        <span className="text-[10px] text-muted-foreground/75">Product of Torrential Technologies</span>
      </footer>
    </div>
  );
}
