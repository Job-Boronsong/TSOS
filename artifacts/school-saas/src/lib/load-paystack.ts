let scriptLoaded = false;
let pendingLoad: Promise<void> | null = null;

export function loadPaystackScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (pendingLoad) return pendingLoad;
  pendingLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load Paystack SDK"));
    document.head.appendChild(script);
  });
  return pendingLoad;
}
