/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { FirebaseProvider, useAuth } from "@/src/components/FirebaseProvider";
import { EntryView } from "@/src/views/EntryView";
import { OnboardingView } from "@/src/views/OnboardingView";
import { DashboardView } from "@/src/views/DashboardView";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

type ViewState = "entry" | "onboarding" | "dashboard";

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<ViewState>("entry");
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const checkSellerProfile = async () => {
      if (user) {
        setCheckingProfile(true);
        try {
          const sellerDoc = await getDoc(doc(db, "sellers", user.uid));
          if (sellerDoc.exists()) {
            setView("dashboard");
          } else {
            // If logged in but no seller profile, they need to onboard
            setView("onboarding");
          }
        } catch (error) {
          console.error("Error checking seller profile:", error);
          setView("entry");
        } finally {
          setCheckingProfile(false);
        }
      } else {
        setView("entry");
      }
    };

    checkSellerProfile();
  }, [user]);

  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-accent" />
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === "entry" && (
        <motion.div
          key="entry"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <EntryView onRoleSelected={(role) => role === "seller" ? setView("onboarding") : null} />
        </motion.div>
      )}
      
      {view === "onboarding" && (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <OnboardingView onBack={() => setView("entry")} onSuccess={() => setView("dashboard")} />
        </motion.div>
      )}

      {view === "dashboard" && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <DashboardView />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
