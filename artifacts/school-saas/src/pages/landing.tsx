import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Users, ClipboardList, DollarSign, BarChart3, BookOpen,
  MapPin, Calendar, Bell, GraduationCap, CheckCircle2, ArrowRight, Menu, X
} from "lucide-react";
import { useState, useEffect } from "react";

const features = [
  { icon: Users, title: "Student Management", desc: "Enroll, manage and track every student's profile, class history, and academic journey in one place." },
  { icon: ClipboardList, title: "Attendance Tracking", desc: "Daily attendance for students and GPS-based self check-in for teachers — works offline too." },
  { icon: DollarSign, title: "Finance & Fees", desc: "Collect fees, track payments, manage payroll and expenses with full audit trails." },
  { icon: BarChart3, title: "Grade Reports", desc: "Enter scores, generate terminal report cards and cumulative records with a single click." },
  { icon: BookOpen, title: "Timetable & Calendar", desc: "Build class timetables, schedule academic events and share announcements with staff." },
  { icon: MapPin, title: "GPS Check-in", desc: "Teachers check in from their phones. Location is verified against school coordinates automatically." },
  { icon: Calendar, title: "Academic Terms", desc: "Configure multiple terms per year, promotion rules and class structures to match your school." },
  { icon: Bell, title: "Announcements", desc: "Broadcast messages to teachers instantly from the admin dashboard." },
];

const steps = [
  { num: "1", title: "Register your school", desc: "Fill in your school details and create your admin account in under 2 minutes." },
  { num: "2", title: "Set up your classes", desc: "Add classes, subjects, and enrol your students. Import in bulk or add one by one." },
  { num: "3", title: "Add your staff", desc: "Create teacher accounts and assign them to classes. They log in from their own portal." },
  { num: "4", title: "Run your school", desc: "Track attendance, collect fees, enter grades and generate reports — all from one dashboard." },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/platform/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.monthlyPrice) setMonthlyPrice(d.monthlyPrice); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="TSOS" className="h-9 w-auto" />
            <span className="font-bold text-slate-800 text-sm hidden sm:block leading-tight">
              Torrential School<br />Operations Suite
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
            <Button size="sm" onClick={() => navigate("/register")}>Get Started Free</Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3 text-sm">
            <a href="#features" className="block text-slate-600 hover:text-slate-900" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-slate-600 hover:text-slate-900" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="block text-slate-600 hover:text-slate-900" onClick={() => setMenuOpen(false)}>Pricing</a>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/login")}>Sign In</Button>
              <Button size="sm" className="flex-1" onClick={() => navigate("/register")}>Get Started</Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 50%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-700 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
            <GraduationCap className="w-4 h-4" />
            Built for African schools
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            The complete school<br />management platform
          </h1>
          <p className="text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            TSOS gives school administrators full control over students, attendance, fees, grades, and staff — 
            all in one simple platform designed for Ghana and Africa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold text-base px-8" onClick={() => navigate("/register")}>
              Start Free 14-Day Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-blue-400 text-white hover:bg-blue-800/50 text-base px-8" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-300">No credit card required · Cancel any time</p>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-slate-50 border-y border-slate-100 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-slate-500 text-center">
          <span>✓ Student & class management</span>
          <span>✓ GPS teacher check-in</span>
          <span>✓ Fee collection & payroll</span>
          <span>✓ Terminal report cards</span>
          <span>✓ Offline-friendly</span>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Everything your school needs</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">From enrolment to end-of-term reports, TSOS handles the day-to-day so you can focus on education.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-xl border border-slate-100 p-6 hover:shadow-md hover:border-blue-100 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Up and running in minutes</h2>
            <p className="text-slate-500 text-lg">No IT team required. Register, set up, and go.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="bg-white rounded-xl border border-slate-100 p-6 flex gap-4">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">{num}</div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-500 text-lg">One plan. All features included. Start free.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
          {/* Free trial */}
          <div className="flex-1 rounded-2xl border border-slate-200 p-8">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Free Trial</p>
            <p className="text-4xl font-extrabold mb-1">GHS 0</p>
            <p className="text-slate-500 text-sm mb-6">14 days · No card needed</p>
            <ul className="space-y-3 text-sm text-slate-600 mb-8">
              {[
                "Full access to every feature",
                "Unlimited students & teachers",
                "GPS teacher check-in",
                "Terminal report cards",
                "Finance & payroll",
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => navigate("/register")}>Start Free Trial</Button>
          </div>

          {/* Paid plan */}
          <div className="flex-1 rounded-2xl border-2 border-blue-600 p-8 relative">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Full Access</p>
            <p className="text-4xl font-extrabold mb-1">
              {monthlyPrice !== null
                ? <>GHS {monthlyPrice.toLocaleString()}<span className="text-base font-normal text-slate-400">/mo</span></>
                : <span className="text-slate-300 text-3xl">Loading…</span>
              }
            </p>
            <p className="text-slate-500 text-sm mb-6">Per school · Billed monthly</p>
            <ul className="space-y-3 text-sm text-slate-600 mb-8">
              {[
                "Everything in Free Trial",
                "Continued full feature access",
                "Discount for 3+ months upfront",
                "New features as they ship",
                "Email support",
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/register")}>
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-blue-900 text-white py-16 px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to transform how you run your school?</h2>
        <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">Join schools across Ghana using TSOS to save time and stay organised.</p>
        <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-10" onClick={() => navigate("/register")}>
          Register Your School — It's Free
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}torrential-tech-logo-dark.png`} alt="Torrential Technologies" className="h-7 w-auto opacity-80" />
          </div>
          <div className="flex gap-6">
            <a href="mailto:info@torrentialtechnologies.com" className="hover:text-white transition-colors">info@torrentialtechnologies.com</a>
          </div>
          <p>© {new Date().getFullYear()} Torrential Technologies</p>
        </div>
      </footer>
    </div>
  );
}
