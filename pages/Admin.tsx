import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ref, get, push, set, remove, update, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BarChartIcon, UtensilsIcon, TruckIcon, UserIcon, TrashIcon, PlusIcon, BikeIcon, ClipboardIcon } from '../components/Icons';
import { Restaurant, MenuItem, AdminRole, AdminUser, Order } from '../types';
import ImageUploader from '../components/ImageUploader';

// --- STATUS ENUM PATCHED IN --- //
const OrderStatus = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  DELIVERED: 'delivered'
} as const;

const DAILY_DATA = [
  { name: 'Mon', orders: 45, revenue: 4500 },
  { name: 'Tue', orders: 52, revenue: 5200 },
  { name: 'Wed', orders: 48, revenue: 4800 },
  { name: 'Thu', orders: 61, revenue: 6100 },
  { name: 'Fri', orders: 85, revenue: 10500 },
  { name: 'Sat', orders: 95, revenue: 12000 },
  { name: 'Sun', orders: 70, revenue: 8000 },
];

const CATEGORY_DATA = [
  { name: 'Food Delivery', value: 75 },
  { name: 'Parcels', value: 25 },
];

const COLORS = ['#E63946', '#457B9D'];

const AdminPage = () => {
  const { user, loading, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Restaurant Management State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRestaurant, setCurrentRestaurant] = useState<Partial<Restaurant>>({});
  const [currentMenu, setCurrentMenu] = useState<MenuItem[]>([]);
  
  // Admin Management State
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('driver');

  // Orders / Dispatch State
  const [orders, setOrders] = useState<Order[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch Data on Load
  useEffect(() => {
    if (!loading && !user) return;
    
    if (userRole) {
      // Realtime Listener for Orders
      const ordersRef = ref(db, 'orders');
      console.log("Listening to orders at:", ordersRef.toString());
      
      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("Orders data received:", Object.keys(data).length, "items");
          const fetched = Object.keys(data).map(key => ({ id: key, ...data[key] })) as Order[];
          // Sort by newest first
          fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(fetched);
        } else {
          console.log("No orders data found in DB");
          setOrders([]);
        }
      }, (error) => {
        console.error("Orders listener error:", error);
      });
      
      if (userRole === 'super_admin') {
        fetchRestaurants();
        fetchAdmins();
      }

      return () => unsubscribeOrders();
    }
  }, [user, loading, userRole]);

  const fetchRestaurants = async () => {
    try {
      const restaurantsRef = ref(db, 'restaurants');
      const snapshot = await get(restaurantsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const fetched = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setRestaurants(fetched);
      } else {
        setRestaurants([]);
      }
    } catch (error) {
      console.error("Error fetching restaurants", error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const adminsRef = ref(db, 'admins');
      const snapshot = await get(adminsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const fetched = Object.keys(data).map(key => ({ id: key, ...data[key] })) as AdminUser[];
        setAdminList(fetched);
      } else {
        setAdminList([]);
      }
    } catch (error) {
      console.error("Error fetching admins", error);
    }
  };

  // --- RESTAURANT ACTIONS ---
  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const restaurantData = {
        name: currentRestaurant.name,
        cuisine: currentRestaurant.cuisine,
        rating: Number(currentRestaurant.rating) || 4.5,
        deliveryTime: currentRestaurant.deliveryTime,
        image: currentRestaurant.image || '',
        menu: currentMenu
      };

      if (currentRestaurant.id) {
        await update(ref(db, `restaurants/${currentRestaurant.id}`), restaurantData);
      } else {
        await set(push(ref(db, 'restaurants')), restaurantData);
      }
      
      setIsEditing(false);
      setCurrentRestaurant({});
      setCurrentMenu([]);
      fetchRestaurants();
    } catch (error) {
      console.error("Error saving restaurant:", error);
      alert("Failed to save restaurant");
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this restaurant?")) {
      await remove(ref(db, `restaurants/${id}`));
      fetchRestaurants();
    }
  };

  const handleAddMenuItem = () => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: 'New Item',
      description: 'Description',
      price: 0,
      image: '',
      category: 'Mains'
    };
    setCurrentMenu([...currentMenu, newItem]);
  };

  const handleUpdateMenuItem = (id: string, field: keyof MenuItem, value: any) => {
    setCurrentMenu(currentMenu.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveMenuItem = (id: string) => {
    setCurrentMenu(currentMenu.filter(item => item.id !== id));
  };

  // --- ADMIN MANAGEMENT ACTIONS (Super Admin) ---
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    const emailToAdd = newAdminEmail.toLowerCase().trim();

    try {
        const adminsRef = ref(db, 'admins');
        // Fetch all to check duplicate client-side (avoids missing index error)
        const snapshot = await get(adminsRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const exists = Object.values(data).some((a: any) => a.email.toLowerCase() === emailToAdd);
            
            if (exists) {
                alert("This user is already a registered driver/admin.");
                return;
            }
        }

        await set(push(adminsRef), { email: emailToAdd, role: newAdminRole });
        
        setNewAdminEmail('');
        fetchAdmins();
      } catch (error) {
        console.error("Error adding admin:", error);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
      if (window.confirm("Remove this user?")) {
          await remove(ref(db, `admins/${id}`));
          fetchAdmins();
      }
  };

  const handlePromoteAdmin = async (id: string, currentRole: AdminRole) => {
    const newRole = currentRole === 'driver' ? 'super_admin' : 'driver';
    if (window.confirm(`Change role to ${newRole}?`)) {
      await update(ref(db, `admins/${id}`), { role: newRole });
      fetchAdmins();
    }
  };

  // --- DISPATCH ACTIONS ---
  const handleAssignDriver = async (orderId: string, driverEmail: string) => {
    try {
      await update(ref(db, `orders/${orderId}`), { 
        assignedDriverId: driverEmail,
        status: OrderStatus.ASSIGNED
      });
      // No manual fetch needed, onValue listener will update state
    } catch (error) {
      console.error("Error assigning driver:", error);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
     console.log("MARK DELIVERED CLICKED:", orderId);
     // Removed window.confirm for now to rule out browser blocking

     setActionLoading(orderId);
     
     try {
       // Optimistic UI Update
       setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DELIVERED } : o));

       console.log("Attempting DB Update for:", `orders/${orderId}`, { status: OrderStatus.DELIVERED });

       const orderRef = ref(db, `orders/${orderId}`);
       
       // Add a timeout race to detect hanging promises
       const updatePromise = update(orderRef, { status: OrderStatus.DELIVERED });
       const timeoutPromise = new Promise((_, reject) => 
         setTimeout(() => reject(new Error("Database update timed out (5s)")), 5000)
       );

       await Promise.race([updatePromise, timeoutPromise]);
       
       console.log(`DB Update successful for ${orderId}`);
       alert("Order marked as delivered!");
     } catch (error: any) {
       console.error("Error updating order:", error);
       alert(`Failed to update database. Error: ${error.message}`);
       // Revert optimistic update if failed
       // In a real app we would revert, but let's keep it simple for debugging
     } finally {
       setActionLoading(null);
     }
  };

  // --- RENDERING HELPERS ---
  
  // Filter orders for Drivers
  const myJobs = orders.filter(o => {
      if (!user?.email || !o.assignedDriverId) return false;
      return o.assignedDriverId.trim().toLowerCase() === user.email.trim().toLowerCase() && o.status !== OrderStatus.DELIVERED;
  });
  
  const myCompletedJobs = orders.filter(o => {
      if (!user?.email || !o.assignedDriverId) return false;
      return o.assignedDriverId.trim().toLowerCase() === user.email.trim().toLowerCase() && o.status === OrderStatus.DELIVERED;
  });

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const assignedOrders = orders.filter(o => o.status === OrderStatus.ASSIGNED);

  if (loading) return <div className="p-10 text-center">Loading Panel...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
        <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
        <p className="text-gray-500 mb-6">Please log in to your driver or admin account.</p>
        <Link to="/auth" className="block w-full bg-brand-dark text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-red-100 text-center">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl">🚫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">Your account ({user.email}) is not registered as a driver or admin.</p>
        <Link to="/" className="text-brand-blue font-bold hover:underline">Return Home</Link>
      </div>
    );
  }

  const isSuperAdmin = userRole === 'super_admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             {isSuperAdmin ? <BarChartIcon className="w-8 h-8 text-brand-red" /> : <BikeIcon className="w-8 h-8 text-brand-blue" />}
             {isSuperAdmin ? 'Super Admin Dashboard' : 'Driver Portal'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${isSuperAdmin ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
               {userRole.replace('_', ' ')}
             </span>
             <span className="text-gray-500 text-sm">{user.email}</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}>Overview</button>
            
            {isSuperAdmin && (
              <>
                <button onClick={() => setActiveTab('dispatch')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeTab === 'dispatch' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}>Dispatch ({pendingOrders.length})</button>
                <button onClick={() => setActiveTab('restaurants')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeTab === 'restaurants' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}>Restaurants</button>
                <button onClick={() => setActiveTab('admins')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeTab === 'admins' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}>Drivers & Staff</button>
              </>
            )}
            
            {!isSuperAdmin && (
               <button onClick={() => setActiveTab('myjobs')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeTab === 'myjobs' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}>My Jobs ({myJobs.length})</button>
            )}
        </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {isSuperAdmin ? (
                  <>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-gray-500 text-sm font-medium uppercase">Total Orders (All Time)</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-gray-500 text-sm font-medium uppercase">Pending Dispatch</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{pendingOrders.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-gray-500 text-sm font-medium uppercase">Total Staff</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{adminList.length}</h3>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-gray-500 text-sm font-medium uppercase">My Active Jobs</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{myJobs.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-gray-500 text-sm font-medium uppercase">Completed Jobs</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{myCompletedJobs.length}</h3>
                      <span className="text-green-500 text-sm font-bold">Good Job!</span>
                    </div>
                  </>
                )}
            </div>

            {isSuperAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Revenue (Simulated)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DAILY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R${value/1000}k`}/>
                      <Tooltip formatter={(value: number) => [`R ${value}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#1D3557" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                  </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Service Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value">
                          {CATEGORY_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
                  </div>
              </div>
            )}
        </div>
      )}

      {/* --- DISPATCH TAB (Super Admin Only) --- */}
      {activeTab === 'dispatch' && isSuperAdmin && (
         <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Dispatching</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                      <tr>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Address</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Assign Driver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...pendingOrders, ...assignedOrders].map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-4 font-mono text-xs">{order.id.slice(-6)}</td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{order.customerName}</div>
                            <div className="text-xs text-gray-500">{order.customerPhone}</div>
                          </td>
                          <td className="p-4 text-sm max-w-xs truncate">{order.address}</td>
                          <td className="p-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === OrderStatus.PENDING ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                               {order.status}
                             </span>
                          </td>
                          <td className="p-4">
                             {order.status === OrderStatus.PENDING ? (
                               <select 
                                onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                                className="border rounded px-2 py-1 text-sm bg-white"
                                defaultValue=""
                               >
                                 <option value="" disabled>Select Driver</option>
                                 {adminList.filter(a => a.role === 'driver' || a.role === 'super_admin').map(driver => (
                                   <option key={driver.id} value={driver.email}>{driver.email}</option>
                                 ))}
                               </select>
                             ) : (
                               <span className="text-sm text-gray-600">{order.assignedDriverId}</span>
                             )}
                          </td>
                        </tr>
                      ))}
                      {pendingOrders.length === 0 && assignedOrders.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No active orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {/* --- MY JOBS TAB (Driver/Admin Only) --- */}
      {activeTab === 'myjobs' && !isSuperAdmin && (
         <div className="animate-fade-in">
             <h2 className="text-xl font-bold text-gray-900 mb-4">My Assigned Jobs</h2>
             <div className="grid grid-cols-1 gap-4">
                {myJobs.length === 0 ? (
                  <div className="bg-white p-10 text-center rounded-xl border border-gray-100">
                    <p className="text-gray-500">No active jobs assigned to you yet.</p>
                  </div>
                ) : (
                  myJobs.map(job => (
                    <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">#{job.id.slice(-4)}</span>
                             <span className="text-xs font-bold text-blue-600 uppercase">{OrderStatus.ASSIGNED.charAt(0).toUpperCase() + OrderStatus.ASSIGNED.slice(1)}</span>
                           </div>
                           <h3 className="text-lg font-bold text-gray-900">{job.address}</h3>
                           <p className="text-sm text-gray-600">Customer: {job.customerName} ({job.customerPhone})</p>
                           <p className="text-sm text-gray-500 mt-1 italic">"{job.instructions || 'No special instructions'}"</p>
                           <div className="mt-2 text-sm font-bold text-brand-red">Collect: R {job.total} ({job.paymentMethod})</div>
                           {/* Display Items */}
                           {job.items && job.items.length > 0 && (
                             <div className="mt-2 text-xs text-gray-500">
                               <strong>Items:</strong> {job.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                             </div>
                           )}
                        </div>
                        <button 
                          onClick={() => handleCompleteOrder(job.id)}
                          disabled={actionLoading === job.id}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-md w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === job.id ? 'Updating...' : 'Mark Delivered'}
                        </button>
                    </div>
                  ))
                )}
             </div>
         </div>
      )}

      {/* --- RESTAURANTS TAB (Super Admin) --- */}
      {activeTab === 'restaurants' && isSuperAdmin && (
          <div className="animate-fade-in">
              {!isEditing ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Manage Restaurants</h2>
                          <button 
                            onClick={() => { setCurrentRestaurant({}); setCurrentMenu([]); setIsEditing(true); }}
                            className="bg-brand-red text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
                          >
                              <PlusIcon className="w-4 h-4" /> Add Restaurant
                          </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                          {restaurants.map(rest => (
                              <div key={rest.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <img src={rest.image || 'https://via.placeholder.com/100'} alt={rest.name} className="w-16 h-16 rounded-md object-cover bg-gray-200" />
                                      <div>
                                          <h3 className="font-bold text-gray-900">{rest.name}</h3>
                                          <p className="text-sm text-gray-500">{rest.cuisine} • {rest.rating} ★</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => { setCurrentRestaurant(rest); setCurrentMenu(rest.menu || []); setIsEditing(true); }}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-white text-gray-700"
                                      >
                                          Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteRestaurant(rest.id)}
                                        className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100"
                                      >
                                          Delete
                                      </button>
                                  </div>
                              </div>
                          ))}
                          {restaurants.length === 0 && <p className="text-gray-500 text-center py-4">No restaurants found.</p>}
                      </div>
                  </div>
              ) : (
                  // --- EDIT FORM (Same as before) ---
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                      <div className="flex justify-between items-center mb-6 border-b pb-4">
                          <h2 className="text-xl font-bold text-gray-900">{currentRestaurant.id ? 'Edit Restaurant' : 'New Restaurant'}</h2>
                          <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-800">Cancel</button>
                      </div>
                      
                      <form onSubmit={handleSaveRestaurant} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                  <input required value={currentRestaurant.name || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, name: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                                  <input required value={currentRestaurant.cuisine || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, cuisine: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                  <input type="number" step="0.1" max="5" required value={currentRestaurant.rating || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, rating: parseFloat(e.target.value)})} className="w-full border rounded-lg px-4 py-2" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                  <input required value={currentRestaurant.deliveryTime || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, deliveryTime: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
                              </div>
                          </div>
                          <div>
                                <ImageUploader label="Cover Image" currentImage={currentRestaurant.image} onImageSelected={(base64) => setCurrentRestaurant({...currentRestaurant, image: base64})} />
                          </div>
                          <div className="border-t pt-6">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-gray-800">Menu Items</h3>
                                  <button type="button" onClick={handleAddMenuItem} className="text-sm text-brand-blue font-bold">+ Add Item</button>
                              </div>
                              <div className="space-y-4">
                                  {currentMenu.map((item) => (
                                      <div key={item.id} className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start border border-gray-200">
                                          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                              <input value={item.name} onChange={e => handleUpdateMenuItem(item.id, 'name', e.target.value)} className="border rounded px-2 py-1" placeholder="Name" />
                                              <input type="number" value={item.price} onChange={e => handleUpdateMenuItem(item.id, 'price', Number(e.target.value))} className="border rounded px-2 py-1" placeholder="Price" />
                                              <input value={item.description} onChange={e => handleUpdateMenuItem(item.id, 'description', e.target.value)} className="border rounded px-2 py-1 md:col-span-2" placeholder="Description" />
                                              <div className="md:col-span-2">
                                                  <ImageUploader label="Item Image" currentImage={item.image} onImageSelected={(base64) => handleUpdateMenuItem(item.id, 'image', base64)} />
                                              </div>
                                              <select value={item.category} onChange={e => handleUpdateMenuItem(item.id, 'category', e.target.value)} className="border rounded px-2 py-1">
                                                  <option>Mains</option>
                                                  <option>Starters</option>
                                                  <option>Dessert</option>
                                                  <option>Drinks</option>
                                              </select>
                                          </div>
                                          <button type="button" onClick={() => handleRemoveMenuItem(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="flex justify-end pt-4">
                              <button type="submit" className="bg-brand-dark text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">Save Changes</button>
                          </div>
                      </form>
                  </div>
              )}
          </div>
      )}

      {/* --- ADMINS TAB (Super Admin) --- */}
      {activeTab === 'admins' && isSuperAdmin && (
          <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Drivers & Staff</h2>
              
              <form onSubmit={handleAddAdmin} className="flex gap-2 mb-8 p-4 bg-gray-50 rounded-lg flex-col md:flex-row">
                  <input 
                    type="email" 
                    required 
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter email address..." 
                    className="flex-grow border border-gray-300 rounded-lg px-4 py-2 outline-none" 
                  />
                  <select 
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                    className="border border-gray-300 rounded-lg px-4 py-2 outline-none bg-white"
                  >
                    <option value="driver">Driver</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <button type="submit" className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors">
                      Add User
                  </button>
              </form>

              <div className="space-y-3">
                  <div className="grid grid-cols-12 text-xs font-bold text-gray-500 uppercase px-4 mb-2">
                    <div className="col-span-5">User</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-4 text-right">Actions</div>
                  </div>
                  {adminList.map(admin => (
                      <div key={admin.id} className="grid grid-cols-12 items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                              <div className="bg-gray-200 p-2 rounded-full flex-shrink-0">
                                  <UserIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="font-medium text-gray-900 truncate">{admin.email}</span>
                          </div>
                          <div className="col-span-3">
                             <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${admin.role === 'super_admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                               {admin.role.replace('_', ' ')}
                             </span>
                          </div>
                          <div className="col-span-4 flex justify-end gap-2">
                              {admin.email !== user.email && (
                                <>
                                  <button 
                                    onClick={() => handlePromoteAdmin(admin.id, admin.role)}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                  >
                                    {admin.role === 'driver' ? 'Make Super Admin' : 'Make Driver'}
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveAdmin(admin.id)}
                                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                              {admin.email === user.email && (
                                  <span className="text-xs text-gray-400 italic">Current User</span>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminPage;
