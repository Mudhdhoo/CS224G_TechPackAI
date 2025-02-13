
import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, User, Settings, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/project/setup", label: "New Project" },
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-primary border-b z-50">
        <div className="container h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="text-xl font-semibold dark:text-white">
              TechPack.ai
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className={cn(
                "nav-link",
                location.pathname === "/settings" && "nav-link-active"
              )}
              title="Settings"
            >
              <Settings size={20} />
            </Link>
            <Link
              to="/profile"
              className={cn(
                "nav-link",
                location.pathname === "/profile" && "nav-link-active"
              )}
              title="Profile"
            >
              <User size={20} />
            </Link>
            <button
              onClick={handleSignOut}
              className="nav-link"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-primary border-r transition-all duration-300 ease-in-out z-40",
          isSidebarOpen ? "translate-x-0" : "-translate-x-64"
        )}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "nav-link block py-2 px-4 rounded-lg transition-colors",
                location.pathname === item.href 
                  ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white" 
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300 ease-in-out",
          isSidebarOpen ? "pl-64" : "pl-0"
        )}
      >
        <div className="container py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
