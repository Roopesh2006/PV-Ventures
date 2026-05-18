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
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-8 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Store className="text-white w-4 h-4" />
            </div>
            <span className="font-display font-bold">SellerCentral</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 text-primary rounded-xl font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-xl font-medium transition-colors">
            <Package className="w-5 h-5" /> Inventory
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-xl font-medium transition-colors">
             <TrendingUp className="w-5 h-5" /> Analytics
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
           <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={logout}>
              <LogOut className="w-5 h-5 mr-3" /> Logout
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-bottom border-slate-200 px-8 py-4 flex items-center justify-between">
           <h2 className="text-xl font-display font-bold">Marketplace Overview</h2>
           <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search everything..." className="pl-10 h-10 w-64 bg-slate-100 border-none rounded-lg" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
                <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} alt="" />
              </div>
           </div>
        </header>

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
                   {/* Abstract background element */}
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
            <h3 className="text-2xl font-display font-bold">Inventory Management</h3>
            <Button onClick={() => setIsAddingProduct(true)} className="bg-primary hover:bg-slate-800 rounded-xl h-12 px-6 shadow-lg shadow-slate-200">
               <Plus className="w-5 h-5 mr-2" /> Add New Product
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white p-1 rounded-xl mb-6 shadow-sm border border-slate-100 h-12">
              <TabsTrigger value="all" className="rounded-lg h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white">All Products</TabsTrigger>
              <TabsTrigger value="active" className="rounded-lg h-full px-6">Active</TabsTrigger>
              <TabsTrigger value="draft" className="rounded-lg h-full px-6">Drafts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {products.length === 0 ? (
                   <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <div className="max-w-xs mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Box className="w-10 h-10 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-bold">No products yet</h4>
                        <p className="text-slate-500 text-sm mt-2 mb-6">Your inventory is currently empty. Start uploading your products to reach more customers.</p>
                        <Button onClick={() => setIsAddingProduct(true)} variant="outline" className="rounded-xl">Create your first listing</Button>
                      </div>
                   </div>
                 ) : (
                   products.map((product) => (
                      <motion.div 
                        layout 
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                         <Card className="border-none shadow-sm hover:shadow-xl transition-all rounded-3xl overflow-hidden group">
                            <div className="h-48 bg-slate-200 relative">
                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                               <div className="absolute bottom-4 left-4">
                                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] text-white font-bold uppercase tracking-wider">SKU: {product.sku}</span>
                               </div>
                               <img 
                                 src={`https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400`} 
                                 alt={product.name} 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                               />
                            </div>
                            <CardContent className="p-6">
                               <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-lg line-clamp-1">{product.name}</h4>
                                  <span className="text-accent font-bold">₹{product.costPrice + product.profit}</span>
                               </div>
                               <p className="text-slate-500 text-sm line-clamp-2 mb-4">{product.description}</p>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-slate-50 rounded-xl">
                                     <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dimensions</span>
                                     <span className="text-xs font-semibold">{product.dimensions || "N/A"}</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-xl">
                                     <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Weight</span>
                                     <span className="text-xs font-semibold">{product.weight || "N/A"}</span>
                                  </div>
                               </div>
                            </CardContent>
                         </Card>
                      </motion.div>
                   ))
                 )}
               </div>
            </TabsContent>
          </Tabs>
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
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-primary text-white">
                 <div>
                   <h3 className="text-2xl font-display font-bold">Add New Product</h3>
                   <p className="text-slate-400 text-sm">Fill in the details to list your item.</p>
                 </div>
                 <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                 <form id="add-product-form" onSubmit={handleSubmit(onSubmitProduct)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="prodName" className="text-xs uppercase font-bold text-slate-400">Product Name</Label>
                          <Input id="prodName" {...register("name")} placeholder="Premium Wireless Headphones" className="h-12 rounded-xl" />
                          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                       </div>

                       <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="desc" className="text-xs uppercase font-bold text-slate-400">Description</Label>
                          <Input id="desc" {...register("description")} placeholder="Describe the key features and value..." className="h-12 rounded-xl" />
                          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="dims" className="text-xs uppercase font-bold text-slate-400">Dimensions</Label>
                          <Input id="dims" {...register("dimensions")} placeholder="15 x 10 x 5 cm" className="h-12 rounded-xl" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="wgt" className="text-xs uppercase font-bold text-slate-400">Weight</Label>
                          <Input id="wgt" {...register("weight")} placeholder="500g" className="h-12 rounded-xl" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="sku" className="text-xs uppercase font-bold text-slate-400">SKU</Label>
                          <Input id="sku" {...register("sku")} placeholder="HEAD-WRL-001" className="h-12 rounded-xl" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="cp" className="text-xs uppercase font-bold text-slate-400">Cost Price (₹)</Label>
                          <Input type="number" id="cp" {...register("costPrice")} placeholder="1200" className="h-12 rounded-xl" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="profit" className="text-xs uppercase font-bold text-slate-400">Target Profit (₹)</Label>
                          <Input type="number" id="profit" {...register("profit")} placeholder="300" className="h-12 rounded-xl" />
                       </div>

                       <div className="space-y-2">
                          <Label htmlFor="pkg" className="text-xs uppercase font-bold text-slate-400">Packaging Cost (₹)</Label>
                          <Input type="number" id="pkg" {...register("packagingCost")} placeholder="50" className="h-12 rounded-xl" />
                       </div>
                    </div>
                 </form>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                 <Button variant="outline" className="flex-1 h-14 rounded-2xl" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
                 <Button 
                   form="add-product-form"
                   type="submit" 
                   disabled={loading}
                   className="flex-1 h-14 rounded-2xl bg-accent hover:bg-blue-600 text-white font-bold"
                 >
                   {loading ? <Loader2 className="animate-spin" /> : "Save Product Listing"}
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
