import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (section: string) => {
    if (location.pathname === '/') {
      // If we're already on the home page, just scroll to the section
      const element = document.getElementById(section);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If we're on another page, navigate to home with the hash
      navigate(`/#${section}`);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50">
      <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-lg backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/logo-v2.svg" alt="TechPack.ai Logo" className="w-8 h-8" />
          <span className="text-xl font-semibold text-foreground">TechPack.ai</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => handleNavigation('features')}
            className="text-neutral-600 hover:text-foreground transition-colors font-medium"
          >
            Features
          </button>
          <button 
            onClick={() => handleNavigation('pricing')}
            className="text-neutral-600 hover:text-foreground transition-colors font-medium"
          >
            Pricing
          </button>
          <Link to="/about" className="text-neutral-600 hover:text-foreground transition-colors font-medium">
            About
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button className="bg-accent-blue hover:bg-accent-blue/90 text-foreground">
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
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Try for free
                  <ArrowRight className="ml-2 h-4 w-4" />
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
              <button 
                onClick={() => handleNavigation('features')}
                className="text-left text-neutral-600 hover:text-foreground transition-colors font-medium px-4 py-2 hover:bg-neutral-100 rounded-lg w-full"
              >
                Features
              </button>
              <button 
                onClick={() => handleNavigation('pricing')}
                className="text-left text-neutral-600 hover:text-foreground transition-colors font-medium px-4 py-2 hover:bg-neutral-100 rounded-lg w-full"
              >
                Pricing
              </button>
              <Link to="/about" className="text-neutral-600 hover:text-foreground transition-colors font-medium px-4 py-2 hover:bg-neutral-100 rounded-lg">
                About
              </Link>
              <hr className="border-neutral-200 my-2" />
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button className="bg-accent-blue hover:bg-accent-blue/90 text-foreground w-full">
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
                    <Button className="bg-accent-blue hover:bg-accent-blue/90 text-foreground w-full">
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
