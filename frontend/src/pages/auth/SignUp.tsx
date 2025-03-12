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
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="block mb-12">
            <img src="/images/logo-v2.svg" alt="TechPack.ai Logo" className="w-8 h-8" />
          </Link>
          
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
            <p className="text-gray-500">Join TechPack AI and start exploring</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none transition-all duration-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none transition-all duration-200"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-2 rounded-lg transition-all duration-200 mt-4"
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-[#8B5CF6] hover:text-[#7C3AED] font-medium transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:block w-1/2 relative bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 overflow-hidden">
        {/* Large floating orbs */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        
        {/* Medium floating orbs */}
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob-reverse animation-delay-3000" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob-reverse animation-delay-5000" />
        
        {/* Small floating orbs */}
        <div className="absolute top-1/3 right-1/2 w-32 h-32 bg-violet-200 rounded-full mix-blend-multiply filter blur-lg opacity-50 animate-pulse animation-delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 w-32 h-32 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-lg opacity-50 animate-pulse animation-delay-4000" />
        
        {/* Flowing lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8B5CF615_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF615_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <div className="text-center space-y-6 max-w-lg">
            <h2 className="text-3xl font-bold text-gray-800">Join TechPackAI Today</h2>
            <p className="text-lg text-gray-600">
              Transform your fashion tech pack workflow with AI-powered automation and intelligent document processing.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
