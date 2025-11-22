import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ref, get, push, set, remove, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BarChartIcon, UtensilsIcon, TruckIcon, UserIcon, TrashIcon, PlusIcon } from '../components/Icons';
import { Restaurant, MenuItem } from '../types';

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
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'restaurants' | 'admins'>('overview');
  
  // Restaurant Management State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRestaurant, setCurrentRestaurant] = useState<Partial<Restaurant>>({});
  const [currentMenu, setCurrentMenu] = useState<MenuItem[]>([]);
  
  // Admin Management State
  const [adminList, setAdminList] = useState<{id: string, email: string}[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Fetch Data on Load
  useEffect(() => {
    if (!loading && !user) {
      // Allow viewing the "Login Required" screen
      return;
    }
    
    if (isAdmin) {
      fetchRestaurants();
      fetchAdmins();
    }
  }, [user, loading, isAdmin]);

  const fetchRestaurants = async () => {
    const restaurantsRef = ref(db, 'restaurants');
    const snapshot = await get(restaurantsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const fetched = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      setRestaurants(fetched);
    } else {
      setRestaurants([]);
    }
  };

  const fetchAdmins = async () => {
    const adminsRef = ref(db, 'admins');
    const snapshot = await get(adminsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const fetched = Object.keys(data).map(key => ({ id: key, email: data[key].email }));
      setAdminList(fetched);
    } else {
      setAdminList([]);
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
        image: currentRestaurant.image || 'https://via.placeholder.com/400x300',
        menu: currentMenu
      };

      if (currentRestaurant.id) {
        // Update in RTDB
        const restaurantRef = ref(db, `restaurants/${currentRestaurant.id}`);
        await update(restaurantRef, restaurantData);
      } else {
        // Create in RTDB
        const restaurantsRef = ref(db, 'restaurants');
        const newRestRef = push(restaurantsRef);
        await set(newRestRef, restaurantData);
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
      const restaurantRef = ref(db, `restaurants/${id}`);
      await remove(restaurantRef);
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

  // --- ADMIN ACTIONS ---

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    try {
        // Check duplicate
        const adminsRef = ref(db, 'admins');
        const q = query(adminsRef, orderByChild('email'), equalTo(newAdminEmail));
        const snapshot = await get(q);
        
        if (snapshot.exists()) {
            alert("This user is already an admin.");
            return;
        }

        const newAdminRef = push(adminsRef);
        await set(newAdminRef, { email: newAdminEmail, role: 'admin' });
        
        setNewAdminEmail('');
        fetchAdmins();
    } catch (error) {
        console.error("Error adding admin:", error);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
      if (window.confirm("Remove admin privileges from this user?")) {
          const adminRef = ref(db, `admins/${id}`);
          await remove(adminRef);
          fetchAdmins();
      }
  };


  // --- RENDERING ---

  if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
        <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
        <p className="text-gray-500 mb-6">Please log in to your account to access the dashboard.</p>
        <Link to="/auth" className="block w-full bg-brand-dark text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-red-100 text-center">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl">🚫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">Your account ({user.email}) does not have administrative privileges.</p>
        <Link to="/" className="text-brand-blue font-bold hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             <BarChartIcon className="w-8 h-8 text-brand-dark" />
             Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Logged in as {user.email}</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => setActiveTab('restaurants')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'restaurants' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Restaurants
            </button>
             <button 
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'admins' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Access Control
            </button>
        </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium uppercase">Total Revenue (Weekly)</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">R 51,100</h3>
                <span className="text-green-500 text-sm font-bold">+12% from last week</span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium uppercase">Active Orders</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">14</h3>
                <span className="text-brand-blue text-sm font-bold">8 Food, 6 Parcels</span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium uppercase">Active Drivers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">28</h3>
                <span className="text-gray-400 text-sm">In West Rand District</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Revenue</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DAILY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R${value/1000}k`}/>
                    <Tooltip formatter={(value: number) => [`R ${value}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
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
        </div>
      )}

      {/* --- RESTAURANTS TAB --- */}
      {activeTab === 'restaurants' && (
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
                          {restaurants.length === 0 && <p className="text-gray-500 text-center py-4">No restaurants found. Add one to get started.</p>}
                      </div>
                  </div>
              ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                      <div className="flex justify-between items-center mb-6 border-b pb-4">
                          <h2 className="text-xl font-bold text-gray-900">{currentRestaurant.id ? 'Edit Restaurant' : 'New Restaurant'}</h2>
                          <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-800">Cancel</button>
                      </div>
                      
                      <form onSubmit={handleSaveRestaurant} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                  <input required value={currentRestaurant.name || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, name: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="e.g. Burger King" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                                  <input required value={currentRestaurant.cuisine || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, cuisine: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="e.g. Fast Food" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                  <input type="number" step="0.1" max="5" required value={currentRestaurant.rating || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, rating: parseFloat(e.target.value)})} className="w-full border rounded-lg px-4 py-2" placeholder="4.5" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                                  <input required value={currentRestaurant.deliveryTime || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, deliveryTime: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="e.g. 20-30 min" />
                              </div>
                          </div>
                          <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input value={currentRestaurant.image || ''} onChange={e => setCurrentRestaurant({...currentRestaurant, image: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="https://..." />
                          </div>

                          <div className="border-t pt-6">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-gray-800">Menu Items</h3>
                                  <button type="button" onClick={handleAddMenuItem} className="text-sm text-brand-blue font-bold">+ Add Item</button>
                              </div>
                              
                              <div className="space-y-4">
                                  {currentMenu.map((item, index) => (
                                      <div key={item.id} className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start border border-gray-200">
                                          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                              <input value={item.name} onChange={e => handleUpdateMenuItem(item.id, 'name', e.target.value)} className="border rounded px-2 py-1" placeholder="Item Name" />
                                              <input type="number" value={item.price} onChange={e => handleUpdateMenuItem(item.id, 'price', Number(e.target.value))} className="border rounded px-2 py-1" placeholder="Price" />
                                              <input value={item.description} onChange={e => handleUpdateMenuItem(item.id, 'description', e.target.value)} className="border rounded px-2 py-1 md:col-span-2" placeholder="Description" />
                                              <input value={item.image} onChange={e => handleUpdateMenuItem(item.id, 'image', e.target.value)} className="border rounded px-2 py-1 md:col-span-2" placeholder="Image URL" />
                                              <select value={item.category} onChange={e => handleUpdateMenuItem(item.id, 'category', e.target.value)} className="border rounded px-2 py-1">
                                                  <option>Mains</option>
                                                  <option>Starters</option>
                                                  <option>Dessert</option>
                                                  <option>Drinks</option>
                                              </select>
                                          </div>
                                          <button type="button" onClick={() => handleRemoveMenuItem(item.id)} className="text-red-500 hover:text-red-700">
                                              <TrashIcon className="w-5 h-5" />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="flex justify-end pt-4">
                              <button type="submit" className="bg-brand-dark text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                                  Save All Changes
                              </button>
                          </div>
                      </form>
                  </div>
              )}
          </div>
      )}

      {/* --- ADMINS TAB --- */}
      {activeTab === 'admins' && (
          <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Admin Access</h2>
              
              <form onSubmit={handleAddAdmin} className="flex gap-2 mb-8 p-4 bg-gray-50 rounded-lg">
                  <input 
                    type="email" 
                    required 
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter email address..." 
                    className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none" 
                  />
                  <button type="submit" className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors">
                      Add Admin
                  </button>
              </form>

              <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Current Admins</h3>
                  {adminList.map(admin => (
                      <div key={admin.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="bg-gray-200 p-2 rounded-full">
                                  <UserIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="font-medium text-gray-900">{admin.email}</span>
                          </div>
                          {admin.email !== user.email && (
                              <button 
                                onClick={() => handleRemoveAdmin(admin.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-semibold"
                              >
                                  Remove Access
                              </button>
                          )}
                          {admin.email === user.email && (
                              <span className="text-xs bg-brand-light text-brand-dark px-2 py-1 rounded-full font-bold">You</span>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminPage;