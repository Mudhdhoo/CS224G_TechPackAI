
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import MouseGradient from "@/components/effects/MouseGradient";
import GrainEffect from "@/components/effects/GrainEffect";
import "@/styles/auth-layout.css";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col">
        <header className="h-16 px-8 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo-v2.svg" alt="TechPack.ai" className="h-8 w-auto" />
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-12 py-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-[#E8F4F8]">
        {/* Animated grid background */}
        <motion.div 
          className="absolute inset-0 bg-grid-pattern opacity-10"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
        />

        {/* Main image container */}
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 flex items-center justify-center p-16"
        >
          <motion.div 
            className="relative w-full h-full max-w-2xl mx-auto"
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <img 
              src="/images/dress-design.svg" 
              alt="Dress Design Blueprint" 
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </motion.div>
        </motion.div>

        {/* Gradient overlay with animation */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-[#E8F4F8]/80 via-transparent to-[#E8F4F8]/20"
          animate={{
            opacity: [0.7, 0.5, 0.7],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </div>
    </div>
  );
};

export default AuthLayout;

