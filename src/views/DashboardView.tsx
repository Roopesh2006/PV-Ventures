import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/components/FirebaseProvider";
import { Product } from "@/src/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Plus, 
  LayoutDashboard, 
  LogOut, 
  CheckCircle2, 
  X, 
  Search, 
  TrendingUp, 
  Box,
  DollarSign,
  Maximize2,
  Store,
  Loader2
} from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().min(5, "Description is too short"),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  sku: z.string().min(3, "SKU is required"),
  costPrice: z.coerce.number().min(0),
  profit: z.coerce.number().min(0),
  packagingCost: z.coerce.number().min(0),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const DashboardView: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddSuccess, setShowAddSuccess] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "inventory" | "analytics" | "profile">("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
  });

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "products"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
    });

    return unsubscribe;
  }, [user]);

  const onSubmitProduct = async (data: ProductFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        ...data,
        sellerId: user.uid, // Simplifying for prototype
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      reset();
      setIsAddingProduct(false);
      setShowAddSuccess(false); // Hide the initial success message if adding more
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="p-8">
            <AnimatePresence>
              {showAddSuccess && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="mb-8"
                >
                  <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-start gap-5 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2">
                        <button onClick={() => setShowAddSuccess(false)} className="p-1 hover:bg-emerald-100 rounded-full transition-colors">
                          <X className="w-4 h-4 text-emerald-600" />
                        </button>
                     </div>
                     <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-emerald-900">Registration Successful!</h3>
                        <p className="text-emerald-700 mt-1">Your seller account is now active. You can start adding products to your storefront.</p>
                        <Button onClick={() => setIsAddingProduct(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                          Add your first product
                        </Button>
                     </div>
                     <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
               {[
                 { label: "Total Products", value: products.length, icon: Box, color: "bg-blue-500" },
                 { label: "Active Listings", value: products.length, icon: Package, color: "bg-purple-500" },
                 { label: "Total Revenue", value: "₹0", icon: DollarSign, color: "bg-orange-500" },
                 { label: "Growth", value: "+0%", icon: TrendingUp, color: "bg-emerald-500" },
               ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                     <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                           <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                              <stat.icon className="w-5 h-5" />
                           </div>
                           <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">7 Days</span>
                        </div>
                        <h4 className="text-2xl font-bold font-display">{stat.value}</h4>
                        <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
                     </CardContent>
                  </Card>
               ))}
            </div>

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-bold">Recent Listings</h3>
              <Button onClick={() => setActiveView("inventory")} variant="link" className="text-accent underline">View Inventory</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {products.slice(0, 4).map((product) => (
                  <motion.div layout key={product.id}>
                     <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <div className="h-48 bg-slate-200 relative">
                           <img 
                             src={`https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400`} 
                             alt={product.name} 
                             className="w-full h-full object-cover"
                           />
                        </div>
                        <CardContent className="p-4">
                           <h4 className="font-bold truncate">{product.name}</h4>
                           <p className="text-accent font-bold mt-1">₹{product.costPrice + product.profit}</p>
                        </CardContent>
                     </Card>
                  </motion.div>
               ))}
               {products.length === 0 && (
                 <p className="text-slate-400 col-span-full text-center py-10">No recent products.</p>
               )}
            </div>
          </div>
        );
      case "inventory":
        return (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-display font-bold">Inventory Management</h3>
                <p className="text-slate-500 mt-1">Track and manage your product catalog.</p>
              </div>
              <Button onClick={() => setIsAddingProduct(true)} className="bg-primary hover:bg-slate-800 rounded-xl h-12 px-6">
                 <Plus className="w-5 h-5 mr-2" /> Add Product
              </Button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="bg-slate-50 p-1 rounded-xl">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="out">Out of Stock</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-6 gap-6">
                {products.map((product) => (
                   <Card key={product.id} className="border border-slate-100 rounded-2xl overflow-hidden group hover:border-accent">
                     <div className="aspect-video bg-slate-100 relative">
                        <img 
                          src={`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400`} 
                          className="w-full h-full object-cover"
                        />
                     </div>
                     <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold">{product.name}</h4>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">In Stock</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{product.sku}</p>
                        <div className="mt-4 flex justify-between items-center">
                          <p className="font-bold text-lg">₹{product.costPrice + product.profit}</p>
                          <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                        </div>
                     </CardContent>
                   </Card>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <Box className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Your inventory is empty.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "analytics":
        return (
          <div className="p-8">
            <h3 className="text-3xl font-display font-bold mb-8">Analytics Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="rounded-3xl border-none shadow-sm p-6">
                  <h4 className="font-bold mb-4">Revenue Over Time</h4>
                  <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                     <TrendingUp className="w-8 h-8 text-slate-300" />
                     <span className="ml-2 text-slate-400">Chart data will appear here</span>
                  </div>
               </Card>
               <Card className="rounded-3xl border-none shadow-sm p-6">
                  <h4 className="font-bold mb-4">Top Performing Products</h4>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                         <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                         <div className="flex-1">
                            <div className="h-4 w-24 bg-slate-200 rounded-full mb-2"></div>
                            <div className="h-3 w-16 bg-slate-100 rounded-full"></div>
                         </div>
                         <div className="text-right">
                            <div className="font-bold">₹0</div>
                         </div>
                      </div>
                    ))}
                  </div>
               </Card>
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="p-8 max-w-2xl mx-auto">
            <h3 className="text-3xl font-display font-bold mb-8 text-center uppercase">Seller Profile</h3>
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden p-0">
               <div className="h-32 bg-primary"></div>
               <div className="p-8 -mt-16">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mb-4">
                      <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}`} className="w-full h-full" />
                    </div>
                    <h4 className="text-2xl font-bold">{user?.displayName || "Global Merchandiser"}</h4>
                    <p className="text-slate-500">{user?.email}</p>
                    
                    <div className="grid grid-cols-2 w-full gap-4 mt-10">
                       <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Score</p>
                          <p className="text-xl font-bold text-emerald-600">98%</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Since</p>
                          <p className="text-xl font-bold">May 2026</p>
                       </div>
                    </div>

                    <Button onClick={logout} className="mt-8 w-full bg-red-50 text-red-600 hover:bg-red-100 border-none h-12 rounded-xl font-bold">
                       Sign Out Session
                    </Button>
                  </div>
               </div>
            </Card>
          </div>
        )
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden">
      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <Store className="text-white w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">PV Ventures.</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-400">
             <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {[
            { id: "overview", label: "Dashboard", icon: LayoutDashboard },
            { id: "inventory", label: "Inventory", icon: Package },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveView(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeView === item.id ? "bg-slate-950 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
           <button 
             onClick={() => {
               setActiveView("profile");
               setIsSidebarOpen(false);
             }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all mb-3 ${activeView === "profile" ? "bg-slate-100 text-slate-950 shadow-sm" : "text-slate-400 hover:bg-slate-50"}`}
           >
             <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-white shadow-sm">
                <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             </div>
             <span className="truncate text-sm">My Profile</span>
           </button>
           <Button variant="ghost" className="w-full justify-start h-12 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-colors" onClick={logout}>
              <LogOut className="w-5 h-5 mr-3" /> Logout
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              >
                 <LayoutDashboard className="w-5 h-5" />
              </button>
              <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs font-medium">
                 <span className="opacity-50">App</span>
                 <span className="opacity-30">/</span>
                 <span className="text-slate-900 font-bold capitalize">{activeView}</span>
              </div>
           </div>

           <div className="flex items-center gap-3 md:gap-5">
              <div className="hidden lg:flex relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input placeholder="Search..." className="pl-11 h-11 w-64 bg-slate-50 border-none rounded-2xl text-xs focus:bg-white focus:ring-0 transition-all" />
              </div>
              <button onClick={() => setActiveView("profile")} className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl border-2 border-white shadow-lg overflow-hidden hover:scale-105 transition-transform active:scale-95 duration-200">
                <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Add Product Modal (Simulated) */}
      <AnimatePresence>
        {isAddingProduct && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsAddingProduct(false)}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-950 text-white relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
                 <div className="relative z-10">
                   <h3 className="text-2xl font-display font-bold italic uppercase tracking-tight">New Listing.</h3>
                   <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Entry ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                 </div>
                 <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white relative z-10">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <form id="add-product-form" onSubmit={handleSubmit(onSubmitProduct)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                       <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="prodName" className="text-xs font-semibold text-slate-600 ml-1">Product Name</Label>
                          <Input id="prodName" {...register("name")} placeholder="Enter product name" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                          {errors.name && <p className="text-xs text-red-500 font-medium ml-1">{errors.name.message}</p>}
                       </div>

                       <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="desc" className="text-xs font-semibold text-slate-600 ml-1">Description</Label>
                          <Input id="desc" {...register("description")} placeholder="Brief product description" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                          {errors.description && <p className="text-xs text-red-500 font-medium ml-1">{errors.description.message}</p>}
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="dims" className="text-xs font-semibold text-slate-600 ml-1">Dimensions</Label>
                          <Input id="dims" {...register("dimensions")} placeholder="L x W x H" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="wgt" className="text-xs font-semibold text-slate-600 ml-1">Weight</Label>
                          <Input id="wgt" {...register("weight")} placeholder="e.g. 1.5kg" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="sku" className="text-xs font-semibold text-slate-600 ml-1">SKU</Label>
                          <Input id="sku" {...register("sku")} placeholder="Stock keeping unit" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="cp" className="text-xs font-semibold text-slate-600 ml-1">Cost Price (₹)</Label>
                          <Input type="number" id="cp" {...register("costPrice")} placeholder="Purchase cost" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="profit" className="text-xs font-semibold text-slate-600 ml-1">Profit Margin (₹)</Label>
                          <Input type="number" id="profit" {...register("profit")} placeholder="Expected profit" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="pkg" className="text-xs font-semibold text-slate-600 ml-1">Packaging Cost (₹)</Label>
                          <Input type="number" id="pkg" {...register("packagingCost")} placeholder="Packing materials cost" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>
                    </div>
                 </form>
              </div>

              <div className="p-8 border-t border-slate-50 bg-white flex flex-col md:flex-row gap-4">
                 <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-slate-400 hover:text-slate-900" onClick={() => setIsAddingProduct(false)}>Cancel Operation</Button>
                 <Button 
                   form="add-product-form"
                   type="submit" 
                   disabled={loading}
                   className="flex-1 h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98]"
                 >
                   {loading ? <Loader2 className="animate-spin" /> : "Deploy to Inventory"}
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
