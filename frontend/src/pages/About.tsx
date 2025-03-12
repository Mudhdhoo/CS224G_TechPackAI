import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import MouseGradient from "@/components/effects/MouseGradient";
import GrainEffect from "@/components/effects/GrainEffect";
import Navigation from "@/components/landing/Navigation";
import Footer from "@/components/landing/Footer";

const About = () => {
  useEffect(() => {
    document.title = 'About TechPackAI';
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 relative overflow-x-hidden">
      <MouseGradient />
      <GrainEffect />
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <section className="space-y-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">About TechPackAI</h1>
            <p className="text-xl text-muted-foreground">
              Empowering innovation through AI-driven technical documentation.
            </p>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              At TechPackAI, we're dedicated to revolutionizing the way technical information is organized, accessed, and utilized. 
              Our platform leverages cutting-edge AI to transform complex technical information into structured, 
              searchable knowledge that accelerates innovation and problem-solving.
            </p>
            <p className="text-lg text-muted-foreground">
              We believe that effective knowledge management is the key to technological advancement, 
              and our goal is to make technical expertise more accessible and actionable for everyone.
            </p>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">What We Do</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-xl font-medium mb-2">Document Processing</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes technical documents to extract and organize valuable information, 
                  making it easy to find exactly what you need.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-xl font-medium mb-2">Knowledge Management</h3>
                <p className="text-muted-foreground">
                  We transform scattered technical information into structured, accessible knowledge bases 
                  that grow with your organization.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-xl font-medium mb-2">Intelligent Search</h3>
                <p className="text-muted-foreground">
                  Our semantic search capabilities understand the context of your queries, 
                  delivering precise answers rather than just keyword matches.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-xl font-medium mb-2">Innovation Support</h3>
                <p className="text-muted-foreground">
                  By connecting related concepts and insights across your documentation, 
                  we help identify new opportunities and solutions.
                </p>
              </div>
            </div>
          </section>
          
          <section className="space-y-4 text-center pt-8">
            <h2 className="text-2xl font-semibold text-foreground">Ready to get started?</h2>
            <Link to="/signup">
              <Button size="lg" className="mt-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                Try for free
              </Button>
            </Link>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About; 