
import { Link, Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50">
        <div className="container h-full flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">
            TackPack.AI
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="nav-link">
              Log In
            </Link>
            <Link to="/signup" className="button-primary">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-16 min-h-screen">
        <div className="container py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;

