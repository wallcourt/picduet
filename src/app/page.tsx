import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/generate");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/picduet-logo.png" alt="PicDuet" className="h-8" />
        <a
          href="/auth/login"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Sign in
        </a>
      </nav>

      <HeroSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
