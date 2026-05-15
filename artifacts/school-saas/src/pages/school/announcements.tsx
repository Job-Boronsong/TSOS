import { useState, useEffect } from "react";
import { SchoolAdminLayout } from "@/components/layout";
import { useSchoolId } from "@/lib/school-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Trash2, Share2, MessageCircle, Facebook, Instagram, Copy, CheckCheck, Users, Globe, UserCheck, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Props { params: { schoolSlug: string } }

interface Announcement {
  id: number;
  title: string;
  message: string;
  imageUrl: string | null;
  target: string;
  createdAt: string;
}

const TARGET_OPTS = [
  { value: "staff", label: "Staff Only", icon: UserCheck, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "parents", label: "Parents (Public)", icon: Globe, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "both", label: "Everyone", icon: Users, color: "bg-purple-100 text-purple-700 border-purple-200" },
];

function TargetBadge({ target }: { target: string }) {
  const opt = TARGET_OPTS.find(o => o.value === target) ?? TARGET_OPTS[0];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${opt.color}`}>
      <opt.icon className="w-3 h-3" />{opt.label}
    </span>
  );
}

function SharePanel({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formatted = `📢 ${announcement.title}\n\n${announcement.message}`;

  const copyText = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(formatted)}`, "_blank");
  };

  const shareFacebook = async () => {
    await navigator.clipboard.writeText(formatted);
    toast({ title: "Text copied!", description: "Opening Facebook — paste your message in the post." });
    setTimeout(() => window.open("https://www.facebook.com/", "_blank"), 800);
  };

  const shareInstagram = async () => {
    await navigator.clipboard.writeText(formatted);
    toast({ title: "Text copied!", description: "Opening Instagram — paste your message in a new post." });
    setTimeout(() => window.open("https://www.instagram.com/", "_blank"), 800);
  };

  const shareTwitter = () => {
    const t = formatted.length > 260 ? formatted.slice(0, 257) + "…" : formatted;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Share Announcement</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="bg-slate-50 border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">PREVIEW</p>
            <p className="font-bold text-sm">📢 {announcement.title}</p>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{announcement.message}</p>
          </div>

          {/* Copy button */}
          <Button variant="outline" className="w-full gap-2" onClick={copyText}>
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Message Text"}
          </Button>

          {/* Share buttons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share on</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={shareWhatsApp} className="gap-2 bg-[#25D366] hover:bg-[#20B858] text-white">
                <MessageCircle className="w-4 h-4" />WhatsApp
              </Button>
              <Button onClick={shareFacebook} className="gap-2 bg-[#1877F2] hover:bg-[#1565C0] text-white">
                <Facebook className="w-4 h-4" />Facebook
              </Button>
              <Button onClick={shareInstagram} className="gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white border-0">
                <Instagram className="w-4 h-4" />Instagram
              </Button>
              <Button onClick={shareTwitter} className="gap-2 bg-black hover:bg-gray-900 text-white">
                <ExternalLink className="w-4 h-4" />X (Twitter)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Facebook and Instagram will open with the text copied — paste it into your post.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Announcements({ params }: Props) {
  const { schoolSlug } = params;
  const schoolId = useSchoolId();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sharing, setSharing] = useState<Announcement | null>(null);

  const [form, setForm] = useState({ title: "", message: "", target: "staff", imageUrl: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!schoolId) return;
    setLoading(true);
    fetch(`/api/schools/${schoolId}/announcements`, { credentials: "include" })
      .then(r => r.json()).then(setAnnouncements).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast({ variant: "destructive", title: "Title and message are required" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/announcements`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const created: Announcement = await res.json();
      toast({ title: "Announcement published!" });
      setForm({ title: "", message: "", target: "staff", imageUrl: "" });
      setShowForm(false);
      setAnnouncements(a => [created, ...a]);
      // Offer to share if target includes parents
      if (created.target === "parents" || created.target === "both") {
        setSharing(created);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement? Teachers who haven't seen it yet will miss it.")) return;
    await fetch(`/api/schools/${schoolId}/announcements/${id}`, { method: "DELETE", credentials: "include" });
    setAnnouncements(a => a.filter(x => x.id !== id));
    toast({ title: "Announcement deleted" });
  };

  const fmtDate = (ts: string) =>
    format(new Date(ts), "MMM d, yyyy · h:mm a");

  return (
    <SchoolAdminLayout schoolSlug={schoolSlug}>
      {sharing && <SharePanel announcement={sharing} onClose={() => setSharing(null)} />}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-primary" />Announcements
            </h1>
            <p className="text-sm text-muted-foreground">Publish updates for staff and parents, with social media sharing.</p>
          </div>
          <Button onClick={() => setShowForm(v => !v)} className="gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Announcement"}
          </Button>
        </div>

        {/* New Announcement Form */}
        {showForm && (
          <Card className="border-primary/30 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New Announcement</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. End-of-term celebration"
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Write your full announcement here…"
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                    required
                  />
                </div>

                {/* Target audience */}
                <div className="space-y-2">
                  <Label>Who should see this?</Label>
                  <div className="flex gap-2 flex-wrap">
                    {TARGET_OPTS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, target: opt.value }))}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${
                          form.target === opt.value
                            ? opt.color + " ring-2 ring-offset-1 ring-primary/30"
                            : "bg-white text-muted-foreground border-muted hover:bg-muted/30"
                        }`}
                      >
                        <opt.icon className="w-3.5 h-3.5" />{opt.label}
                      </button>
                    ))}
                  </div>
                  {(form.target === "parents" || form.target === "both") && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5">
                      After publishing, you'll get share buttons for WhatsApp, Facebook, and Instagram.
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={saving} className="gap-2">
                    <Megaphone className="w-4 h-4" />
                    {saving ? "Publishing…" : "Publish Announcement"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Announcements list */}
        {loading ? (
          <p className="text-muted-foreground text-sm py-6">Loading…</p>
        ) : announcements.length === 0 ? (
          <Card className="text-center py-14">
            <CardContent>
              <Megaphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No announcements yet.</p>
              <p className="text-sm text-muted-foreground">Click "New Announcement" to publish your first one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <Card key={a.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{a.title}</p>
                        <TargetBadge target={a.target} />
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">{a.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{fmtDate(a.createdAt)}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(a.target === "parents" || a.target === "both") && (
                        <Button variant="outline" size="sm" className="gap-1 h-8 px-2.5 text-xs" onClick={() => setSharing(a)}>
                          <Share2 className="w-3.5 h-3.5" />Share
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SchoolAdminLayout>
  );
}
