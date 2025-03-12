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
      <div className="w-full min-h-screen flex flex-col">
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
    </div>
  );
};

export default AuthLayout;
