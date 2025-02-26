import Navigation from "@/components/landing/Navigation";
import Hero from "@/components/landing/Hero";
import MetricsSection from "@/components/landing/MetricsSection";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import MouseGradient from "@/components/effects/MouseGradient";
import ScrollProgress from "@/components/effects/ScrollProgress";
import GrainEffect from "@/components/effects/GrainEffect";

const Index = () => {
  return (
    <div className="min-h-screen bg-neutral-100 relative overflow-x-hidden">
      <ScrollProgress />
      <MouseGradient />
      <GrainEffect />
      <Navigation />
      <Hero />
      <MetricsSection />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;