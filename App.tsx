import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBagIcon, TruckIcon, UtensilsIcon, BarChartIcon, MenuIcon, XIcon, UserIcon, LogOutIcon, ClipboardIcon } from './components/Icons';
import RestaurantsPage from './pages/Restaurants';
import ParcelsPage from './pages/Parcels';
import AdminPage from './pages/Admin';
import HomePage from './pages/Home';
import CartPage from './pages/Cart';
import AuthPage from './pages/Auth';
import OrdersPage from './pages/Orders'; // Import new page
import { CartItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Layout = ({ children, cartCount }: { children?: React.ReactNode; cartCount: number }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Hide Navbar on Auth Page
  if (location.pathname === '/auth') {
    return <>{children}</>;
  }

  const isActive = (path: string) => location.pathname === path ? 'text-brand-red font-bold' : 'text-gray-600 hover:text-brand-red';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-black text-brand-dark tracking-tighter">
                  As'B<span className="text-brand-red">o</span>nge
                </span>
                <span className="ml-1 text-sm text-gray-500 font-medium lowercase">eats</span>
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              <Link to="/" className={isActive('/')}>Home</Link>
              <Link to="/restaurants" className={isActive('/restaurants')}>Restaurants</Link>
              <Link to="/parcels" className={isActive('/parcels')}>Parcel Service</Link>
              <Link to="/admin" className={isActive('/admin')}>Admin</Link>
              
              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              <Link to="/cart" className="relative group">
                <ShoppingBagIcon className="w-6 h-6 text-gray-700 group-hover:text-brand-red transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              {user ? (
                <div className="relative group flex items-center gap-2 cursor-pointer">
                   <div className="bg-gray-100 p-2 rounded-full">
                     <UserIcon className="w-5 h-5 text-brand-dark" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs font-bold text-gray-900 leading-none">Hello</span>
                     <span className="text-xs text-gray-500 leading-none max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                   </div>
                   
                   {/* Dropdown for Logout */}
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                     <Link to="/orders" className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50">
                        <ClipboardIcon className="w-4 h-4" /> My Orders
                     </Link>
                     <button 
                       onClick={signOut}
                       className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                     >
                       <LogOutIcon className="w-4 h-4" /> Sign Out
                     </button>
                   </div>
                </div>
              ) : (
                <Link to="/auth" className="text-sm font-bold bg-brand-dark text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden gap-4">
               <Link to="/cart" className="relative">
                <ShoppingBagIcon className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <XIcon className="w-6 h-6 text-gray-700"/> : <MenuIcon className="w-6 h-6 text-gray-700"/>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2 animate-fade-in">
             <div className="flex flex-col space-y-2 px-4">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-700">Home</Link>
              <Link to="/restaurants" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-700">Restaurants</Link>
              <Link to="/parcels" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-700">Parcel Service</Link>
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-700">Admin</Link>
              <div className="border-t border-gray-100 my-2"></div>
              {user ? (
                <>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-700 flex items-center gap-2">
                    <ClipboardIcon className="w-4 h-4" /> My Orders
                  </Link>
                  <button 
                    onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                    className="py-2 text-red-600 font-bold flex items-center gap-2"
                  >
                    <LogOutIcon className="w-4 h-4" /> Sign Out ({user.email?.split('@')[0]})
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-brand-dark font-bold">
                  Sign In / Register
                </Link>
              )}
             </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-brand-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center sm:text-left sm:flex justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-xl font-bold">Asbonge Eats</h3>
            <p className="text-gray-400 text-sm">West Rand's Favorite Delivery Service</p>
          </div>
          <div className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Asbonge Group. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const App = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AuthProvider>
      <HashRouter>
        <Layout cartCount={cartCount}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurants" element={<RestaurantsPage addToCart={addToCart} />} />
            <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} clearCart={clearCart} />} />
            <Route path="/parcels" element={<ParcelsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;