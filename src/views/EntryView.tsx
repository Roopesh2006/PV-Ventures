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
  const { loginWithEmail, registerWithEmail, user } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-advance if already logged in and role not selected
  React.useEffect(() => {
    if (user && !showRoleSelection) {
      setShowRoleSelection(true);
    }
  }, [user]);

  const handleAuth = async (type: "login" | "register") => {
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (type === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      setShowRoleSelection(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters");
      } else {
        setError("An error occurred during authentication");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden font-sans">
      {/* Left side - Branding/Hero */}
      <div className="w-full md:w-1/2 p-8 md:p-24 flex flex-col justify-between bg-primary text-white">
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
               <Store className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight uppercase">SellerCentral</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[0.9] tracking-tighter mb-8 italic">
            YOUR BUSINESS,<br />
            SIMPLIFIED.
          </h1>
          <p className="text-secondary-foreground/70 max-w-md text-lg leading-relaxed">
            The all-in-one platform for vendors to scale, manage, and optimize their online presence. Join thousands of successful sellers today.
          </p>
        </motion.div>

        <div className="mt-12 md:mt-0 flex items-center gap-4 text-secondary-foreground/50 text-sm">
          <span>Powered by Google Cloud</span>
          <span className="w-1 h-1 bg-secondary-foreground/30 rounded-full"></span>
          <span>Zero-latency Infrastructure</span>
        </div>
      </div>

      {/* Right side - Action Area */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        <AnimatePresence mode="wait">
          {!showRoleSelection ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden p-2">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-slate-100 rounded-2xl">
                    <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-6 pt-8 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="m@example.com" 
                            className="pl-10 h-12 rounded-xl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            id="password" 
                            type="password" 
                            className="pl-10 h-12 rounded-xl"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <TabsContent value="login" className="mt-0">
                      <Button 
                        onClick={() => handleAuth("login")}
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg rounded-2xl bg-primary hover:bg-slate-800 text-white transition-all shadow-lg hover:shadow-xl group"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In"}
                        {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                      </Button>
                    </TabsContent>

                    <TabsContent value="register" className="mt-0">
                      <Button 
                        onClick={() => handleAuth("register")}
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg rounded-2xl bg-primary hover:bg-slate-800 text-white transition-all shadow-lg hover:shadow-xl group"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Account"}
                        {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                      </Button>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>

              <p className="mt-8 text-center text-sm text-slate-400">
                Join 10k+ sellers who already simplified their business.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="role"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden p-2">
                <CardHeader className="bg-slate-50 pb-8 rounded-2xl">
                  <CardTitle className="text-2xl font-display font-bold">I am a...</CardTitle>
                  <CardDescription>Choose your account type to personalize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-4">
                  <div 
                    onClick={() => onRoleSelected("seller")}
                    className="group relative p-6 border-2 border-slate-100 rounded-2xl hover:border-accent hover:bg-blue-50/50 cursor-pointer transition-all flex items-center gap-6"
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <Store className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Seller</h3>
                      <p className="text-sm text-slate-500">I want to sell my products and reach customers.</p>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-accent" />
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                        window.alert("Redirecting to Buyer module... (Simulation)");
                        onRoleSelected("buyer");
                    }}
                    className="group relative p-6 border-2 border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-slate-50 cursor-not-allowed transition-all flex items-center gap-6"
                  >
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-400">Buyer</h3>
                      <p className="text-sm text-slate-400">I want to browse products and make purchases.</p>
                    </div>
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest text-slate-300">Temp Inactive</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
