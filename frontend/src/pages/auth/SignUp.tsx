
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
        <div className="space-y-3 text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-lg">Join TechPack AI and start exploring</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="w-full p-5 text-lg border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              className="w-full p-5 text-lg border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-7 text-xl rounded-xl transition-all duration-200 mt-4"
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        <p className="mt-8 text-center text-base text-muted-foreground">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="text-[#8B5CF6] hover:text-[#7C3AED] font-medium transition-colors duration-200"
          >
            Sign in
          </Link>
        </p>
    </div>
  );
};

export default SignUp;
