import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedDocument from "./AnimatedDocument";

const Hero = () => {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden min-h-screen bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 -z-10" />
      
      {/* Floating orbs - Large */}
      <div className="absolute top-20 left-[20%] w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute top-40 right-[20%] w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-40 left-[50%] w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
      
      {/* Floating orbs - Medium */}
      <div className="absolute top-1/4 left-[30%] w-48 h-48 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob-reverse animation-delay-3000" />
      <div className="absolute bottom-1/3 right-[30%] w-48 h-48 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob-reverse animation-delay-5000" />
      
      {/* Floating orbs - Small */}
      <div className="absolute top-1/3 left-[40%] w-32 h-32 bg-violet-200 rounded-full mix-blend-multiply filter blur-lg opacity-30 animate-pulse animation-delay-1000" />
      <div className="absolute bottom-1/4 right-[40%] w-32 h-32 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-lg opacity-30 animate-pulse animation-delay-4000" />
      
      {/* Sparkles - Left Edge */}
      <div className="absolute top-12 left-4 w-3 h-3 bg-white rounded-full animate-ping" />
      <div className="absolute top-24 left-6 w-2 h-2 bg-white rounded-full animate-ping animation-delay-2000" />
      <div className="absolute top-36 left-3 w-4 h-4 bg-white rounded-full animate-ping animation-delay-4000" />
      <div className="absolute top-48 left-5 w-3 h-3 bg-white rounded-full animate-ping animation-delay-1500" />
      <div className="absolute top-60 left-4 w-2 h-2 bg-white rounded-full animate-ping animation-delay-3500" />
      
      {/* Sparkles - Right Edge */}
      <div className="absolute top-16 right-4 w-2 h-2 bg-white rounded-full animate-ping animation-delay-1000" />
      <div className="absolute top-28 right-5 w-3 h-3 bg-white rounded-full animate-ping animation-delay-3000" />
      <div className="absolute top-40 right-3 w-2 h-2 bg-white rounded-full animate-ping animation-delay-2500" />
      <div className="absolute top-52 right-6 w-4 h-4 bg-white rounded-full animate-ping animation-delay-500" />
      <div className="absolute top-64 right-4 w-2 h-2 bg-white rounded-full animate-ping animation-delay-4500" />
      
      {/* Sparkles - Top Edge */}
      <div className="absolute top-3 left-[10%] w-3 h-3 bg-white rounded-full animate-ping animation-delay-2000" />
      <div className="absolute top-4 right-[15%] w-2 h-2 bg-white rounded-full animate-ping animation-delay-3500" />
      <div className="absolute top-2 left-[25%] w-2 h-2 bg-white rounded-full animate-ping animation-delay-1000" />
      <div className="absolute top-5 right-[30%] w-3 h-3 bg-white rounded-full animate-ping animation-delay-4000" />
      
      <div className="min-h-screen flex flex-col items-center justify-center text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-2 mb-8 mt-8"
          >
            <motion.span 
              className="px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue text-sm font-medium inline-flex items-center"
              animate={{
                scale: [1, 1.02, 1],
                backgroundColor: [
                  'rgba(59, 130, 246, 0.1)',
                  'rgba(139, 92, 246, 0.1)',
                  'rgba(59, 130, 246, 0.1)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Sparkles className="w-4 h-4 mr-1" />
              </motion.span>
              AI-Powered Tech Packs
            </motion.span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 text-foreground tracking-tight whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Automate Your<br/>Fashion <span className="text-[#8B5CF6]">Tech Packs</span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-neutral-600 mb-8 mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Streamline your production workflow with AI-powered tech pack automation. 
            Create detailed specifications <span className="text-[#8B5CF6]">faster</span> and with <span className="text-[#8B5CF6]">greater accuracy</span>.
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg">
                Try for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a 
              href="https://www.youtube.com/watch?v=xvFZjo5PgG0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <Button variant="outline" className="px-8 py-6 rounded-xl text-lg font-medium border-2 hover:bg-neutral-100">
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </a>
          </div>
        </div>

        {/* Tech Pack Animation */}
        <motion.div
          className="w-full max-w-4xl mx-auto mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <img 
            src="https://indiasourcing.net/wp-content/uploads/2022/02/dc643931-2db4-4975-ac7c-f77cfcbb59cd.gif"
            alt="Tech Pack Animation"
            className="w-full h-auto rounded-lg shadow-2xl"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;

