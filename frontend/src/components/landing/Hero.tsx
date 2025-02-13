
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const { user } = useAuth();

  return (
    <header className="container-padding py-12 bg-background">
      <div className="max-w-4xl mx-auto text-center relative z-10 pt-32 pb-24">
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Automate Your Fashion Tech Packs
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Streamline your production workflow with AI-powered tech pack automation. 
          Create detailed specifications faster and with greater accuracy.
        </motion.p>
        <motion.div 
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link to={user ? "/dashboard" : "/signup"}>
            <Button 
              size="lg"
              className="bg-accent-blue hover:bg-accent-blue/90 text-foreground font-medium px-8"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg"
            className="border-neutral-300 hover:bg-neutral-100 font-medium px-8"
          >
            Learn More
          </Button>
        </motion.div>
      </div>
    </header>
  );
};

export default Hero;

