
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50">
      <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-blue rounded-full"></div>
          <span className="text-xl font-semibold text-foreground">TechPack.ai</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-neutral-600 hover:text-foreground transition-colors font-medium">Features</a>
          <a href="#pricing" className="text-neutral-600 hover:text-foreground transition-colors font-medium">Pricing</a>
          <a href="#about" className="text-neutral-600 hover:text-foreground transition-colors font-medium">About</a>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button 
                  className="bg-accent-blue hover:bg-accent-blue/90 text-foreground"
                >
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="ghost"
                onClick={() => signOut()}
                className="text-neutral-600 hover:text-foreground hover:bg-neutral-100"
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button 
                  variant="ghost"
                  className="text-neutral-600 hover:text-foreground hover:bg-neutral-100"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  className="bg-accent-blue hover:bg-accent-blue/90 text-foreground"
                >
                  Try for Free
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 hover:bg-neutral-100 rounded-full transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-neutral-600" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-600" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden glass-panel mt-2 rounded-xl p-4 shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-2">
              <a href="#features" className="text-neutral-600 hover:text-foreground transition-colors font-medium px-4 py-2 hover:bg-neutral-100 rounded-lg">Features</a>
              <a href="#pricing" className="text-neutral-600 hover:text-foreground transition-colors font-medium px-4 py-2 hover:bg-neutral-100 rounded-lg">Pricing</a>
              <a href="#about" className="text-neutral-600 hover:text-foreground transition-colors font-medium px-4 py-2 hover:bg-neutral-100 rounded-lg">About</a>
              <hr className="border-neutral-200 my-2" />
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button 
                      className="bg-accent-blue hover:bg-accent-blue/90 text-foreground w-full"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost"
                    onClick={() => signOut()}
                    className="w-full justify-start text-neutral-600 hover:text-foreground hover:bg-neutral-100"
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start text-neutral-600 hover:text-foreground hover:bg-neutral-100"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button 
                      className="bg-accent-blue hover:bg-accent-blue/90 text-foreground w-full"
                    >
                      Try for Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
