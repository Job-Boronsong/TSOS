import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loadPaystackScript } from "@/lib/load-paystack";

interface Props {
  schoolId: number | null;
}

export function SubscriptionExpiredGate({ schoolId }: Props) {
  const [sub, setSub] = useState<any>(null);
  const [renewMonths, setRenewMonths] = useState("1");
  const [preview, setPreview] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchSub = useCallback(() => {
    if (!schoolId) return;
    fetch(`/api/schools/${schoolId}/subscription`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(setSub)
      .catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    fetchSub();
    const interval = setInterval(fetchSub, 30_000);
    return () => clearInterval(interval);
  }, [fetchSub]);

  useEffect(() => {
    if (!schoolId || !renewMonths) { setPreview(null); return; }
    const m = parseInt(renewMonths);
    if (!m || m < 1) { setPreview(null); return; }
    fetch(`/api/schools/${schoolId}/subscription/topup-preview?months=${m}`, { credentials: "include" })
      .then(r => r.json()).then(setPreview).catch(() => setPreview(null));
  }, [renewMonths, schoolId]);

  const handlePay = async () => {
    if (!schoolId) return;
    const months = parseInt(renewMonths) || 1;
    setPaying(true);
    try {
      const initRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ schoolId, months }),
      });
      if (!initRes.ok) throw new Error(await initRes.text());
      const initData = await initRes.json();

      await loadPaystackScript();
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) { toast({ variant: "destructive", title: "Paystack not loaded. Please refresh." }); return; }

      const handler = PaystackPop.setup({
        key: initData.publicKey,
        email: initData.email,
        amount: initData.amount,
        ref: initData.reference,
        currency: "GHS",
        callback: function(response: any) {
          fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ reference: response.reference }),
          }).then(r => {
            if (!r.ok) throw new Error();
            return r.json();
          }).then(data => {
            setPaymentResult(data);
            fetchSub();
          }).catch(() => {
            toast({ variant: "destructive", title: "Payment received but verification failed. Contact support." });
          });
        },
        onClose: function() { setPaying(false); },
      });
      handler.openIframe();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not initialize payment", description: err.message });
    } finally {
      setPaying(false);
    }
  };

  if (!sub || sub.subscriptionStatus !== "expired") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ pointerEvents: "all" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-red-600 px-6 py-5 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Subscription Expired</h2>
          <p className="text-red-100 text-sm mt-1">
            Your school's access has been suspended
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {paymentResult ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl bg-green-50 border border-green-200 p-5 space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-green-800">Payment confirmed!</p>
                <p className="text-sm text-green-700">
                  Subscription active until <strong>{paymentResult.newExpiryDate}</strong>.
                </p>
              </div>
              <Button className="w-full" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload &amp; Continue
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Renew your subscription to restore full access to the platform.
              </p>

              <div className="space-y-2">
                <Label>Number of Months</Label>
                <Input
                  type="number"
                  min="1"
                  value={renewMonths}
                  onChange={e => setRenewMonths(e.target.value)}
                  autoFocus
                />
              </div>

              {preview && (
                <div className="rounded-lg bg-slate-50 border p-3 text-sm space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rate</span>
                    <span>GHS {preview.monthlyPrice?.toLocaleString()} × {preview.months} mo</span>
                  </div>
                  {preview.discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount ({preview.discount}%)</span>
                      <span>−GHS {(preview.monthlyPrice * preview.months * preview.discount / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subscription</span>
                    <span>GHS {preview.amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Paystack fee</span>
                    <span>GHS {preview.paystackFee?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Total charged</span>
                    <span>GHS {preview.chargeAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-primary text-xs mt-1">
                    <span>New expiry after payment</span>
                    <strong>{preview.newExpiry}</strong>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-[#0BA4DB] hover:bg-[#0994C8] text-white"
                disabled={paying || !renewMonths || parseInt(renewMonths) < 1}
                onClick={handlePay}
              >
                {paying
                  ? "Opening payment…"
                  : `Pay GHS ${preview ? preview.chargeAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "…"} with Paystack`}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Contact{" "}
                <a href="mailto:info@torrentialtechnologies.com" className="underline hover:text-foreground">
                  support
                </a>{" "}
                if you need help.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
