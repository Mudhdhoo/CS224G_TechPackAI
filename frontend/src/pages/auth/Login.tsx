
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      toast({
        title: "Successfully logged in",
        description: "Welcome back!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error logging in",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
        <div className="space-y-3 text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-lg">Sign in to your account to continue</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full p-5 text-lg border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full p-5 text-lg border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-7 text-xl rounded-xl transition-all duration-200 mt-4"
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </form>
        <p className="mt-8 text-center text-base text-muted-foreground">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-[#8B5CF6] hover:text-[#7C3AED] font-medium transition-colors duration-200"
          >
            Sign up
          </Link>
        </p>
    </div>
  );
};

export default Login;
