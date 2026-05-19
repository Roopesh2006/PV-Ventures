import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/components/FirebaseProvider";
import { Product, Seller } from "@/src/types";
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
  Loader2,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail as MailIcon,
  MapPin,
  Calendar,
  Layers,
  Info,
  ArrowRight
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
  unit: z.string().min(1, "Unit is required"),
  category: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").or(z.string().length(0)),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const DashboardView: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [showAddSuccess, setShowAddSuccess] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "inventory" | "analytics" | "profile">("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      unit: "Bag",
    }
  });

  useEffect(() => {
    if (!user) return;
    
    // Fetch Seller Data
    const fetchSeller = async () => {
      const q = query(collection(db, "sellers"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSeller({ id: snap.docs[0].id, ...snap.docs[0].data() } as Seller);
      }
    };
    fetchSeller();

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
    
    const images = data.imageUrl ? [data.imageUrl] : [];
    
    // Filter out internal form-only fields
    const { imageUrl, ...productData } = data;

    try {
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), {
          ...productData,
          images,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          images,
          sellerId: user.uid,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      reset();
      setIsAddingProduct(false);
      setEditingProduct(null);
      setShowAddSuccess(false);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue("name", product.name);
    setValue("description", product.description);
    setValue("dimensions", product.dimensions);
    setValue("weight", product.weight);
    setValue("sku", product.sku);
    setValue("costPrice", product.costPrice);
    setValue("profit", product.profit);
    setValue("packagingCost", product.packagingCost);
    setValue("unit", product.unit);
    setValue("imageUrl", product.images[0] || "");
    setIsAddingProduct(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      await deleteDoc(doc(db, "products", id));
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
                     <Card 
                        onClick={() => setViewingProduct(product)}
                        className="border-none shadow-sm rounded-3xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                     >
                        <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center p-3">
                           <img 
                             src={product.images[0] || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400`} 
                             alt={product.name} 
                             className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                           />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Eye className="text-slate-900 w-8 h-8 opacity-20" />
                           </div>
                        </div>
                        <CardContent className="p-4">
                           <h4 className="font-bold truncate">{product.name}</h4>
                           <p className="text-accent font-bold mt-1">₹{product.costPrice + product.profit} / {product.unit}</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 md:p-6 gap-6">
                {products.map((product) => (
                   <Card key={product.id} className="border border-slate-100 rounded-2xl overflow-hidden group hover:border-accent transition-all hover:shadow-lg bg-white">
                     <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
                        <img 
                          src={product.images[0] || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400`} 
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          alt={product.name}
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                           <Button onClick={() => handleEdit(product)} size="icon" variant="secondary" className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md border shadow-sm">
                              <Edit2 className="w-4 h-4 text-slate-600" />
                           </Button>
                           <Button onClick={() => handleDelete(product.id)} size="icon" variant="destructive" className="w-8 h-8 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                     <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold cursor-pointer hover:text-accent" onClick={() => setViewingProduct(product)}>{product.name}</h4>
                          <span className="text-[10px] uppercase font-bold tracking-tight bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">{product.sku}</p>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Price per {product.unit}</span>
                            <p className="font-bold text-lg">₹{product.costPrice + product.profit}</p>
                          </div>
                          <Button onClick={() => setViewingProduct(product)} variant="outline" size="sm" className="text-[10px] h-8 rounded-lg font-bold uppercase tracking-widest border-slate-200">
                             Open Detail <ArrowRight className="w-3 h-3 ml-2" />
                          </Button>
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
                   <h3 className="text-2xl font-display font-bold italic uppercase tracking-tight">{editingProduct ? "Update Listing." : "New Listing."}</h3>
                   <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{editingProduct ? `Edit ID: ${editingProduct.id}` : `Entry ID: ${Math.random().toString(36).substring(7).toUpperCase()}`}</p>
                 </div>
                 <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); reset(); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white relative z-10">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <form id="add-product-form" onSubmit={handleSubmit(onSubmitProduct)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                       <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="prodName" className="text-xs font-semibold text-slate-600 ml-1">Product Name</Label>
                          <Input id="prodName" {...register("name")} placeholder="e.g. PPC UltraTech Weather Plus Cement" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                          {errors.name && <p className="text-xs text-red-500 font-medium ml-1">{errors.name.message}</p>}
                       </div>

                       <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="desc" className="text-xs font-semibold text-slate-600 ml-1">Description</Label>
                          <Input id="desc" {...register("description")} placeholder="Describe the product's primary features and benefits" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                          {errors.description && <p className="text-xs text-red-500 font-medium ml-1">{errors.description.message}</p>}
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="unit" className="text-xs font-semibold text-slate-600 ml-1">Unit of Measure (e.g. Bag, Kg, Piece)</Label>
                          <Input id="unit" {...register("unit")} placeholder="e.g. Bag" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                          {errors.unit && <p className="text-xs text-red-500 font-medium ml-1">{errors.unit.message}</p>}
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="category" className="text-xs font-semibold text-slate-600 ml-1">Product Category</Label>
                          <Input id="category" {...register("category")} placeholder="e.g. Cement, Steel, etc." className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="sku" className="text-xs font-semibold text-slate-600 ml-1">SKU identifier</Label>
                          <Input id="sku" {...register("sku")} placeholder="e.g. UT-WPC-43" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none font-mono" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="dims" className="text-xs font-semibold text-slate-600 ml-1">Dimensions</Label>
                          <Input id="dims" {...register("dimensions")} placeholder="L x W x H" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="wgt" className="text-xs font-semibold text-slate-600 ml-1">Mass Density / Weight</Label>
                          <Input id="wgt" {...register("weight")} placeholder="e.g. 50kg" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="cp" className="text-xs font-semibold text-slate-600 ml-1">Procurement Cost (₹)</Label>
                          <Input type="number" id="cp" {...register("costPrice")} placeholder="Total acquisition cost per unit" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="profit" className="text-xs font-semibold text-slate-600 ml-1">Margin Target (₹)</Label>
                          <Input type="number" id="profit" {...register("profit")} placeholder="Target unit net profit" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>

                       <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-slate-600 ml-1">Product Visual (Image URL)</Label>
                          <Input {...register("imageUrl")} placeholder="https://example.com/product-image.jpg" className="h-12 rounded-xl border-slate-200" />
                          {errors.imageUrl && <p className="text-xs text-red-500 font-medium ml-1">{errors.imageUrl.message}</p>}
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="pkg" className="text-xs font-semibold text-slate-600 ml-1">Logistics Overhead (₹)</Label>
                          <Input type="number" id="pkg" {...register("packagingCost")} placeholder="Packaging and fixed costs" className="h-12 rounded-xl border-slate-200 bg-white focus:ring-slate-900 transition-all shadow-none" />
                       </div>
                    </div>
                 </form>
              </div>

              <div className="p-8 border-t border-slate-50 bg-white flex flex-col md:flex-row gap-4">
                 <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-slate-400 hover:text-slate-900" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); reset(); }}>Cancel Operation</Button>
                 <Button 
                   form="add-product-form"
                   type="submit" 
                   disabled={loading}
                   className="flex-1 h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98]"
                 >
                   {loading ? <Loader2 className="animate-spin" /> : (editingProduct ? "Update Catalog" : "Deploy to Inventory")}
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail View (Buyer Preview) */}
      <AnimatePresence>
        {viewingProduct && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setViewingProduct(null)}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]"
            />
            <motion.div 
               initial={{ opacity: 0, x: "100%" }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 right-0 w-full lg:max-w-6xl bg-[#F4F7F9] shadow-2xl z-[201] overflow-hidden flex flex-col"
            >
               {/* Modal Header */}
               <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <Store className="w-4 h-4" />
                     <span>Product Specification Profile</span>
                  </div>
                  <button onClick={() => setViewingProduct(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                     <X className="w-6 h-6 text-slate-400" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                  <div className="max-w-5xl mx-auto space-y-6">
                     
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 md:p-10 rounded-[32px] shadow-sm border border-slate-100">
                        
                        {/* Left: Main Image */}
                        <div className="lg:col-span-6 flex flex-col items-center">
                           <div className="aspect-square w-full rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-4">
                              <img 
                                src={viewingProduct.images[0] || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800`} 
                                className="max-w-full max-h-full object-contain drop-shadow-xl"
                                alt={viewingProduct.name}
                              />
                           </div>
                           <div className="flex gap-2 mt-4">
                              <div className="w-2 h-2 rounded-full bg-accent"></div>
                              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                           </div>
                        </div>

                        {/* Right: Primary Info */}
                        <div className="lg:col-span-6 space-y-6">
                           <div>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                 <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-md">Validated Listing</span>
                                 <span className="text-slate-300">/</span>
                                 <span className="text-slate-400 text-xs font-medium truncate max-w-[150px]">{viewingProduct.sku}</span>
                              </div>
                              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-tight">{viewingProduct.name}</h2>
                           </div>

                           <div className="flex items-baseline gap-3">
                              <span className="text-3xl md:text-4xl font-display font-bold text-accent">₹{viewingProduct.costPrice + viewingProduct.profit}</span>
                              <span className="text-slate-400 font-medium">/ {viewingProduct.unit}</span>
                           </div>

                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Quantity</Label>
                                 <div className="flex items-center gap-2">
                                    <Input placeholder="Enter Quantity" className="h-12 rounded-xl" />
                                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap">{viewingProduct.unit}s</div>
                                 </div>
                              </div>
                           </div>

                           <Button className="w-full h-14 md:h-16 bg-[#2B3990] hover:bg-[#1e2761] text-white rounded-2xl font-bold text-base md:text-lg shadow-xl shadow-blue-200 active:scale-[0.98] transition-all">
                              Submit Procurement Req.
                           </Button>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                 <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">Verified Stock</span>
                                 </div>
                                 <p className="text-[11px] text-emerald-600 font-medium">Ready for immediate dispatch</p>
                              </div>
                              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                 <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-amber-600" />
                                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Price Protection</span>
                                 </div>
                                 <p className="text-[11px] text-amber-600 font-medium">Best rates guaranteed</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Specs & Description */}
                        <div className="lg:col-span-8 space-y-6">
                           <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
                              <CardHeader className="bg-white border-b border-slate-50">
                                 <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-accent" /> Technical Specifications
                                 </CardTitle>
                              </CardHeader>
                              <CardContent className="p-0">
                                 <div className="divide-y divide-slate-50">
                                    {[
                                       { label: "Designation", value: viewingProduct.name },
                                       { label: "SKU Identifier", value: viewingProduct.sku },
                                       { label: "Unit Basis", value: viewingProduct.unit },
                                       { label: "Dimensions", value: viewingProduct.dimensions || "Not specified" },
                                       { label: "Weight/Mass", value: viewingProduct.weight || "Not specified" },
                                       { label: "Category", value: viewingProduct.category || "General Industry" },
                                       { label: "Availability", value: "In Stock" },
                                    ].map((spec, i) => (
                                       <div key={i} className={`grid grid-cols-12 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                                          <div className="col-span-5 p-4 text-xs font-bold text-slate-500 uppercase tracking-tight pl-8 border-r border-slate-50">
                                             {spec.label}
                                          </div>
                                          <div className="col-span-7 p-4 text-sm font-medium text-slate-800 pl-6 uppercase">
                                             {spec.value}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </CardContent>
                           </Card>

                           <Card className="rounded-[32px] border-none shadow-sm p-8 space-y-4">
                              <h3 className="text-xl font-bold flex items-center gap-2">
                                 <Info className="w-5 h-5 text-accent" /> Strategic Description
                              </h3>
                              <div className="prose prose-slate max-w-none">
                                 <p className="text-slate-600 leading-relaxed font-medium">
                                    {viewingProduct.description}
                                 </p>
                              </div>
                           </Card>
                        </div>

                        {/* Seller / Contact Info */}
                        <div className="lg:col-span-4 space-y-6">
                           <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white p-8 relative">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00897B]/10 rounded-full blur-[40px]"></div>
                              <div className="relative z-10 space-y-6">
                                 <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0">
                                       <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-medium text-slate-400">Merchant Location</p>
                                       <p className="text-sm font-bold text-slate-900">{seller?.address.split(",").pop() || "Strategic Logistics Node"}</p>
                                    </div>
                                 </div>

                                 <div>
                                    <h4 className="text-lg font-bold text-slate-900 leading-tight mb-4">{seller?.companyName || "Premier Authorized Agency"}</h4>
                                    
                                    <div className="space-y-4">
                                       <div className="flex items-center gap-3 text-emerald-600">
                                          <CheckCircle2 className="w-4 h-4" />
                                          <p className="text-[10px] font-bold uppercase tracking-widest">Verified GST: {seller?.gstin || "ACTIVE"}</p>
                                       </div>

                                       <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                             <Phone className="w-3.5 h-3.5 text-slate-400" />
                                             <span className="text-[10px] font-bold text-slate-600">MOBILE</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                             <MailIcon className="w-3.5 h-3.5 text-slate-400" />
                                             <span className="text-[10px] font-bold text-slate-600">EMAIL</span>
                                          </div>
                                          <div className="flex items-center gap-2 ml-auto">
                                             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                             <span className="text-[10px] font-bold text-emerald-600 uppercase">Online</span>
                                          </div>
                                       </div>
                                       
                                       <div className="pt-4 border-t border-slate-100">
                                          <div className="flex items-center justify-between mb-4">
                                             <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs text-slate-500 font-medium">Business Experience</span>
                                             </div>
                                             <span className="text-sm font-bold text-slate-900">{new Date().getFullYear() - (seller?.yearOfEstablishment || 2024)} Years</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs text-slate-500 font-medium">Response Frequency</span>
                                             </div>
                                             <span className="text-sm font-bold text-emerald-600">92% Average</span>
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-3">
                                    <Button className="w-full h-14 rounded-2xl bg-white border-2 border-[#00897B] text-[#00897B] hover:bg-emerald-50 font-bold group">
                                       <Phone className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" /> Connect via Voice
                                    </Button>
                                    <Button className="w-full h-14 rounded-2xl bg-[#00897B] hover:bg-[#00695C] text-white font-bold shadow-lg shadow-emerald-200 group">
                                       <MailIcon className="w-4 h-4 mr-3 group-hover:translate-x-1 transition-transform" /> Contact Enterprise
                                    </Button>
                                 </div>
                              </div>
                           </Card>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
