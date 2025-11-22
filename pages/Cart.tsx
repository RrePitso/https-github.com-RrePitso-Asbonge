import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartItem } from '../types';
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon, CheckCircleIcon } from '../components/Icons';

interface Props {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
}

const CartPage: React.FC<Props> = ({ cart, updateQuantity, clearCart }) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cash'
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = 25; // Fixed delivery fee for West Rand
  const total = subtotal + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API processing
    setTimeout(() => {
      clearCart();
      setStep('success');
      window.scrollTo(0, 0);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-green-100 text-green-600 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
          <CheckCircleIcon className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-brand-dark mb-4">Order Confirmed!</h2>
        <p className="text-xl text-gray-600 mb-8">
          Thank you, {formData.name}. Your food is being prepared and will be delivered to <br/>
          <span className="font-semibold text-gray-900">{formData.address}</span> shortly.
        </p>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8 max-w-md mx-auto text-left">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Order Summary</h3>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Total Paid</span>
            <span className="font-bold text-brand-red">R {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method</span>
            <span className="font-medium capitalize">{formData.paymentMethod}</span>
          </div>
        </div>
        <Link to="/" className="inline-block bg-brand-dark text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-gray-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <ShoppingBagIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/restaurants" className="inline-block bg-brand-red text-white px-8 py-3 rounded-lg font-bold hover:bg-red-600 transition-colors shadow-lg">
          Start Ordering
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {step === 'cart' ? 'Your Basket' : 'Checkout'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2">
          {step === 'cart' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <li key={item.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors">
                    <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-gray-200" />
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                      <p className="text-gray-500 text-sm mb-2">{item.category}</p>
                      <div className="font-bold text-brand-red">R {item.price}</div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 hover:bg-white rounded-md text-gray-600 transition-colors"
                      >
                        {item.quantity === 1 ? <TrashIcon className="w-4 h-4 text-red-500"/> : <MinusIcon className="w-4 h-4"/>}
                      </button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 hover:bg-white rounded-md text-gray-600 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4"/>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                 Delivery Details
               </h2>
               <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                     <input 
                       required
                       name="name"
                       value={formData.name}
                       onChange={handleInputChange}
                       className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                       placeholder="John Doe"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                     <input 
                       required
                       type="tel"
                       name="phone"
                       value={formData.phone}
                       onChange={handleInputChange}
                       className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                       placeholder="072 123 4567"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                   <input 
                     required
                     name="address"
                     value={formData.address}
                     onChange={handleInputChange}
                     className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                     placeholder="Street address, suburb..."
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                   <textarea 
                     name="instructions"
                     value={formData.instructions}
                     onChange={handleInputChange}
                     rows={2}
                     className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
                     placeholder="Gate code, landmarks, etc."
                   />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`border rounded-lg p-4 cursor-pointer flex items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'cash' ? 'border-brand-red bg-red-50 text-brand-red ring-1 ring-brand-red' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="cash" 
                          checked={formData.paymentMethod === 'cash'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <span className="font-bold">Cash on Delivery</span>
                      </label>
                      <label className={`border rounded-lg p-4 cursor-pointer flex items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'card' ? 'border-brand-red bg-red-50 text-brand-red ring-1 ring-brand-red' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="card" 
                          checked={formData.paymentMethod === 'card'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <span className="font-bold">Card on Delivery</span>
                      </label>
                    </div>
                 </div>
               </form>
            </div>
          )}
        </div>

        {/* Order Summary / Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>R {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 mt-3 flex justify-between font-black text-xl text-gray-900">
                <span>Total</span>
                <span>R {total.toFixed(2)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button 
                onClick={() => setStep('checkout')}
                className="w-full bg-brand-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-600 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                Proceed to Checkout
              </button>
            ) : (
              <div className="space-y-3">
                 <button 
                  type="submit"
                  form="checkout-form"
                  className="w-full bg-brand-dark text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  Confirm Order
                </button>
                <button 
                  onClick={() => setStep('cart')}
                  className="w-full bg-white text-gray-500 py-2 rounded-lg font-medium hover:text-gray-800"
                >
                  Back to Cart
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CartPage;
