import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/src/components/FirebaseProvider";
import { ShoppingBag, Store, ArrowRight, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

interface EntryViewProps {
  onRoleSelected: (role: "buyer" | "seller") => void;
}

export const EntryView: React.FC<EntryViewProps> = ({ onRoleSelected }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, user, logout } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuth = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (authMode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      setShowRoleSelection(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Email/Password login is not enabled in Firebase.");
      } else {
        setError(err.message || "An error occurred during authentication");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      setShowRoleSelection(true);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] font-sans">
      {/* Branding Section */}
      <div className="w-full lg:w-[40%] bg-slate-900 p-10 md:p-20 flex flex-col justify-between text-white relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#475569_0%,transparent_50%)]"></div>
        </div>

        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
           className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-10 lg:mb-32">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
               <Store className="text-slate-900 w-6 h-6" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight uppercase">PV Ventures</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
            Grow your business <br className="hidden md:block" /> with confidence.
          </h1>
          <p className="text-slate-400 max-w-sm text-lg font-light leading-relaxed">
            The professional dashboard for managing your multi-channel sales and operations in one place.
          </p>
        </motion.div>

        <div className="mt-12 lg:mt-0 relative z-10 text-slate-500 text-xs font-medium">
          <p>© 2024 PV Ventures. All rights reserved.</p>
        </div>
      </div>

      {/* Auth Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20">
        <AnimatePresence mode="wait">
          {user && !showRoleSelection ? (
            <motion.div
              key="logged-in"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-300">{user.email?.charAt(0).toUpperCase()}</span>
                    )}
                 </div>
                 <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
                 <p className="text-slate-500 text-sm mb-8">Signed in as <span className="font-semibold text-slate-900">{user.email}</span></p>
                 
                 <div className="space-y-3">
                   <Button 
                     onClick={() => setShowRoleSelection(true)}
                     className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                   >
                     Go to Dashboard
                   </Button>
                   <Button 
                     variant="outline"
                     onClick={logout}
                     className="w-full h-14 rounded-xl border-slate-200 text-slate-600 font-medium"
                   >
                     Sign Out
                   </Button>
                 </div>
              </div>
            </motion.div>
          ) : !showRoleSelection ? (
            <motion.div
              key="auth-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-10">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">{authMode === "login" ? "Sign In" : "Create Account"}</h2>
                    <p className="text-slate-500 text-sm">Please enter your details to continue.</p>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                  <button 
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${authMode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setAuthMode("register")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${authMode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Register
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-600">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        className="pl-10 h-14 rounded-xl border-slate-200 focus:ring-slate-900 transition-all shadow-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="pass" className="text-xs font-semibold text-slate-600">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        id="pass" 
                        type="password" 
                        placeholder="••••••••"
                        className="pl-10 h-14 rounded-xl border-slate-200 focus:ring-slate-900 transition-all shadow-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-2.5 text-xs font-medium border border-red-100 overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button 
                    onClick={handleAuth}
                    disabled={isSubmitting}
                    className="w-full h-14 text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-lg active:scale-[0.98] mt-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : (authMode === "login" ? "Sign In" : "Register")}
                  </Button>

                  <div className="relative py-6">
                     <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                     <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white px-4">OR</div>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={handleGoogleAuth}
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-xl border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-3 transition-all hover:border-slate-300 group shadow-none"
                  >
                    <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.38z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">Continue with Google</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl w-full"
            >
              <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 p-10 md:p-12">
                <div className="mb-10">
                  <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome</h2>
                  <p className="text-slate-500 font-medium">Please select your account type to proceed.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    onClick={() => onRoleSelected("seller")}
                    className="group relative p-8 border-2 border-slate-100 rounded-3xl hover:border-slate-900 hover:bg-slate-50 cursor-pointer transition-all duration-300 flex flex-col items-center text-center gap-6"
                  >
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110">
                      <Store className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">Seller</h3>
                      <p className="text-slate-500 text-xs font-medium">Manage your products and orders.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => window.alert("Buyer role is coming soon.")}
                    className="opacity-40 group relative p-8 border-2 border-slate-50 rounded-3xl cursor-not-allowed flex flex-col items-center text-center gap-6"
                  >
                    <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">Buyer</h3>
                      <p className="text-slate-400 text-xs font-medium">Browse and purchase products.</p>
                    </div>
                    <span className="absolute top-4 right-6 text-[8px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Phase 2</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
