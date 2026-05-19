import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/components/FirebaseProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const sellerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  companyName: z.string().min(2, "Company name is required"),
  gstin: z.string().min(15, "Invalid GSTIN format (15 characters)").max(15),
  address: z.string().min(10, "Full address is required"),
  accountDetails: z.string().min(10, "Account details are required"),
  businessPan: z.string().min(10, "Invalid PAN format").max(10),
  yearOfEstablishment: z.coerce.number().min(1900).max(new Date().getFullYear()),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

interface OnboardingViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema) as any,
    defaultValues: {
      yearOfEstablishment: 2024,
    }
  });

  const onSubmit = async (data: SellerFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "sellers", user.uid), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving seller profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 flex items-center justify-center p-4 md:p-8 lg:p-12 font-sans overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-950 mb-8 transition-colors group font-mono text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          Reconfigure Role
        </button>

        <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          <div className="bg-slate-950 p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-20"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold italic tracking-tight uppercase">REGISTRATION.</h2>
              <p className="text-slate-400 text-sm md:text-base mt-2 font-medium">Enterprise profile activation for global commerce nodes.</p>
            </div>
          </div>
          
          <div className="p-8 md:p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-600">Full Name</Label>
                  <Input id="name" {...register("name")} placeholder="Enter your full name" className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-900 text-sm transition-all shadow-none" />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs font-semibold text-slate-600">Business Name</Label>
                  <Input id="companyName" {...register("companyName")} placeholder="Enter your business name" className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-900 text-sm transition-all shadow-none" />
                  {errors.companyName && <p className="text-xs text-red-500 font-medium">{errors.companyName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin" className="text-xs font-semibold text-slate-600">GSTIN</Label>
                  <Input id="gstin" {...register("gstin")} placeholder="15-digit GST number" className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-900 text-sm transition-all shadow-none font-mono" />
                  {errors.gstin && <p className="text-xs text-red-500 font-medium">{errors.gstin.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPan" className="text-xs font-semibold text-slate-600">Business PAN</Label>
                  <Input id="businessPan" {...register("businessPan")} placeholder="Enter business PAN" className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-900 text-sm transition-all shadow-none font-mono uppercase" />
                  {errors.businessPan && <p className="text-xs text-red-500 font-medium">{errors.businessPan.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-xs font-semibold text-slate-600">Business Address</Label>
                  <Input id="address" {...register("address")} placeholder="Complete business address" className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-900 text-sm transition-all shadow-none" />
                  {errors.address && <p className="text-xs text-red-500 font-medium">{errors.address.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountDetails" className="text-xs font-semibold text-slate-600">Bank Account Details</Label>
                  <Input id="accountDetails" {...register("accountDetails")} placeholder="IFSC and Account Number" className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-900 text-sm transition-all shadow-none" />
                  {errors.accountDetails && <p className="text-xs text-red-500 font-medium">{errors.accountDetails.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfEstablishment" className="text-xs font-semibold text-slate-600">Year of Establishment</Label>
                  <Input type="number" id="yearOfEstablishment" {...register("yearOfEstablishment")} placeholder="e.g. 2020" className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-900 text-sm transition-all shadow-none" />
                  {errors.yearOfEstablishment && <p className="text-xs text-red-500 font-medium">{errors.yearOfEstablishment.message}</p>}
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-15 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Submitting...</>
                  ) : (
                    <>Complete Registration</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
