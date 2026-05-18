import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../components/FirebaseProvider";
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to roles
        </button>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden p-2">
          <CardHeader className="bg-primary/5 pb-10 rounded-2xl p-8 border-b border-primary/10">
            <CardTitle className="text-3xl font-display font-bold">Seller Registration</CardTitle>
            <CardDescription className="text-slate-600 mt-2">Please provide your business details to setup your seller account.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 pt-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase font-bold tracking-wider text-slate-400">Full Name</Label>
                  <Input id="name" {...register("name")} placeholder="John Doe" className="h-12 rounded-xl focus:ring-accent" />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs uppercase font-bold tracking-wider text-slate-400">Company Name</Label>
                  <Input id="companyName" {...register("companyName")} placeholder="Acme Corp" className="h-12 rounded-xl" />
                  {errors.companyName && <p className="text-xs text-red-500 font-medium">{errors.companyName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin" className="text-xs uppercase font-bold tracking-wider text-slate-400">GSTIN</Label>
                  <Input id="gstin" {...register("gstin")} placeholder="22AAAAA0000A1Z5" className="h-12 rounded-xl" />
                  {errors.gstin && <p className="text-xs text-red-500 font-medium">{errors.gstin.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPan" className="text-xs uppercase font-bold tracking-wider text-slate-400">Business PAN</Label>
                  <Input id="businessPan" {...register("businessPan")} placeholder="ABCDE1234F" className="h-12 rounded-xl" />
                  {errors.businessPan && <p className="text-xs text-red-500 font-medium">{errors.businessPan.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-xs uppercase font-bold tracking-wider text-slate-400">Address</Label>
                  <Input id="address" {...register("address")} placeholder="123 Business Way, Industrial Estate" className="h-12 rounded-xl" />
                  {errors.address && <p className="text-xs text-red-500 font-medium">{errors.address.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountDetails" className="text-xs uppercase font-bold tracking-wider text-slate-400">Current Account Details</Label>
                  <Input id="accountDetails" {...register("accountDetails")} placeholder="IFSC: HDFC00123 / Acc: 5020..." className="h-12 rounded-xl" />
                  {errors.accountDetails && <p className="text-xs text-red-500 font-medium">{errors.accountDetails.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfEstablishment" className="text-xs uppercase font-bold tracking-wider text-slate-400">Year of Establishment</Label>
                  <Input type="number" id="yearOfEstablishment" {...register("yearOfEstablishment")} className="h-12 rounded-xl" />
                  {errors.yearOfEstablishment && <p className="text-xs text-red-500 font-medium">{errors.yearOfEstablishment.message}</p>}
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl bg-accent hover:bg-blue-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing registration...</>
                  ) : (
                    <><Save className="mr-2 h-5 w-5" /> Complete Registration</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
