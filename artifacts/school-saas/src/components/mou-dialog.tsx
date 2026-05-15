import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

interface MouDialogProps {
  open: boolean;
}

export function MouDialog({ open }: MouDialogProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setScrolledToBottom(false);
      setAgreed(false);
    }
  }, [open]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setScrolledToBottom(true);
    }
  }

  async function handleAccept() {
    if (!agreed) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/auth/accept-mou", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record acceptance");
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Terms accepted", description: "Welcome to the Torrential School Operations Suite." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save acceptance. Please try again." });
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-3xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Terms &amp; Conditions — Memorandum of Understanding
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Please read the full document before accepting. Scroll to the bottom to enable acceptance.
          </p>
        </DialogHeader>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          <div className="px-6 py-4 text-sm leading-relaxed space-y-4 text-foreground">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900">Document Reference: TSOS-MOU-2026</p>
              <p className="text-blue-700 text-xs">Effective Date: 1st May, 2026 · Issued by: Torrential Technologies</p>
            </div>

            <h3 className="font-bold text-base">PREAMBLE</h3>
            <p>
              This Memorandum of Understanding sets out the terms under which <strong>Torrential Technologies</strong> ("Provider")
              provides the <strong>Torrential School Operations Suite (TSOS)</strong> to subscribing educational institutions ("School").
              By using the platform, the School confirms it has read, understood, and agrees to be bound by these terms.
            </p>

            <h3 className="font-bold text-base">PART 1 — SCOPE OF SERVICES</h3>
            <p>
              Services include: student management, class and teacher management, attendance (including GPS-based teacher check-in),
              finance and fee collection, timetabling, academic reports, insights and analytics, feeding/canteen management,
              staff payroll (Ghana PAYE &amp; SSNIT), discipline logs, end-of-year promotion, announcements, operational calendar,
              and offline-first functionality with automatic sync.
            </p>

            <h3 className="font-bold text-base">PART 2 — SUBSCRIPTION AND PAYMENT</h3>
            <p>
              Access is provided on a prepaid monthly subscription basis. Discounts apply: 5% for 3–6 months, 10% for 7+ months.
              Payments are processed via <strong>Paystack</strong>. A 3-day grace period applies after expiry.
            </p>
            <p>
              <strong>Subscription renewal runs from the payment date.</strong> Upon renewal, the new subscription period starts
              from the date of payment and extends for the number of months paid, regardless of the previous expiry date.
              Fees are non-refundable except for verified duplicate payments or extended platform downtime caused by the Provider (7+ consecutive days).
              The Provider will give 30 days' notice of any price changes.
            </p>

            <h3 className="font-bold text-base">PART 3 — DATA OWNERSHIP AND PRIVACY</h3>
            <p>
              All data entered by the School remains its exclusive property. The Provider will not sell or share School Data
              with third parties. Both parties agree to comply with Ghana's <strong>Data Protection Act, 2012 (Act 843)</strong>.
              The School is responsible for obtaining parental/guardian consent for student data collection. School data is retained
              for 90 days after subscription lapse before permanent deletion.
            </p>

            <h3 className="font-bold text-base">PART 4 — SCHOOL RESPONSIBILITIES</h3>
            <p>
              The School is responsible for: the accuracy of all data entered; the security and confidentiality of login credentials;
              ensuring only authorised personnel access the platform; promptly deactivating access for staff who leave.
              The School must not use the platform for unlawful purposes, attempt to reverse-engineer the software, or share credentials
              across multiple institutions.
            </p>

            <h3 className="font-bold text-base">PART 5 — PROVIDER RESPONSIBILITIES</h3>
            <p>
              The Provider will maintain 99% monthly uptime (excluding scheduled maintenance notified 48 hours in advance),
              provide email and in-platform support (standard: 2 business days; critical: 24 hours), and perform regular data backups.
              In the event of Provider-caused data loss, the Provider will restore to the most recent available backup.
            </p>

            <h3 className="font-bold text-base">PART 6 — EMAIL COMMUNICATIONS</h3>
            <p>
              The Provider may send operational emails to the School's registered contact address. These include service notifications,
              billing alerts, subscription reminders, platform announcements, compliance notices, and other communications the Provider
              deems important for the School's use of the platform.
              By accepting this Agreement, the School consents to receiving such communications. The contact email can be updated
              at any time in the School's Settings page. The Provider will not use the School's contact email for unsolicited
              third-party marketing.
            </p>

            <h3 className="font-bold text-base">PART 7 — INTELLECTUAL PROPERTY</h3>
            <p>
              The TSOS platform — including software, design, algorithms, branding, and documentation — is the exclusive intellectual
              property of Torrential Technologies. Nothing in this Agreement transfers any ownership of the platform to the School.
              The School retains ownership of its name, logo, and branding assets uploaded to the platform.
            </p>

            <h3 className="font-bold text-base">PART 8 — LIMITATION OF LIABILITY</h3>
            <p>
              The Provider is not liable for indirect or consequential damages, data loss resulting from the School's failure to
              export data, or decisions made based on platform-generated reports. Total aggregate liability is capped at fees paid
              in the 3 months preceding any claim. The platform is provided "as is."
            </p>

            <h3 className="font-bold text-base">PART 9 — TERMINATION</h3>
            <p>
              Either party may terminate by ceasing subscription renewal (School) or for Agreement violations, fraudulent activity,
              or non-payment (Provider). Upon termination, data is retained for 90 days then permanently deleted.
            </p>

            <h3 className="font-bold text-base">PART 10 — MOU ACCEPTANCE</h3>
            <p>
              This Agreement requires the School's explicit digital acceptance on first login. The acceptance is recorded with
              a timestamp and associated with the authorised administrator's account. Continued use of the platform constitutes
              ongoing agreement to these terms and any future updates (notified per Part 11).
            </p>

            <h3 className="font-bold text-base">PART 11 — AMENDMENTS</h3>
            <p>
              The Provider may update this Agreement with at least 7 days' notice via in-platform notification or email.
              Continued use after the effective date of changes constitutes acceptance of the updated terms.
            </p>

            <h3 className="font-bold text-base">PART 12 — DISPUTE RESOLUTION &amp; GOVERNING LAW</h3>
            <p>
              Disputes shall first be resolved through good-faith discussion (30 days), then mediation if needed. This Agreement
              is governed by the laws of the <strong>Republic of Ghana</strong>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <p className="font-semibold text-amber-900">Important Notice</p>
              <p className="text-amber-800 text-xs mt-1">
                By clicking "Accept &amp; Continue" below, the authorised representative of the School confirms they have read,
                understood, and agree to be bound by this Memorandum of Understanding on behalf of their institution.
                This acceptance is recorded with a timestamp and is legally binding.
              </p>
            </div>

            <p className="text-xs text-muted-foreground italic text-center pb-4">
              Document Version 1.0 · Effective May 2026 · Torrential Technologies
            </p>
          </div>
        </div>

        <div className="border-t px-6 py-4 space-y-4 bg-muted/30 shrink-0">
          {!scrolledToBottom && (
            <p className="text-xs text-center text-muted-foreground animate-pulse">
              ↓ Scroll to the bottom of the document to enable acceptance
            </p>
          )}
          {scrolledToBottom && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="mou-agree"
                checked={agreed}
                onCheckedChange={v => setAgreed(!!v)}
                className="mt-0.5"
              />
              <Label htmlFor="mou-agree" className="text-sm leading-snug cursor-pointer">
                I confirm that I am authorised to accept this agreement on behalf of my institution and that
                I have read and understood the Terms &amp; Conditions set out in this Memorandum of Understanding.
              </Label>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!agreed || !scrolledToBottom || accepting}
            onClick={handleAccept}
          >
            {accepting ? "Recording acceptance…" : "Accept & Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
