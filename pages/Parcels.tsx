import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, set, update, get } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon, CheckCircleIcon } from '../components/Icons';
import { optimizeParcelDescription } from '../services/geminiService';
import { Order, CartItem, FeeSettings } from '../types';
import LocationInput from '../components/LocationInput';

const ParcelsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '', 
    pickupAddress: '',
    recipientName: '',
    deliveryAddress: '',
    description: '',
    weight: '0-5kg',
  });
  
  const [fees, setFees] = useState<FeeSettings>({
      foodDeliveryFee: 25,
      parcelSmallFee: 50,
      parcelMediumFee: 100,
      parcelLargeFee: 200
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [savePickup, setSavePickup] = useState(false);

  // Restore form data from session if returning from auth
  useEffect(() => {
    const saved = sessionStorage.getItem('parcel_temp_data');
    if (saved) {
      setFormData(JSON.parse(saved));
      sessionStorage.removeItem('parcel_temp_data');
    }

    // Fetch Fees
    const fetchFees = async () => {
        try {
          const snapshot = await get(ref(db, 'settings/fees'));
          if (snapshot.exists()) {
            setFees(snapshot.val());
          }
        } catch (err) {
          console.error("Error fetching fees:", err);
        }
    };
    fetchFees();

  }, []);

  // Price calculation based on weight
  const getPrice = (weight: string) => {
    switch(weight) {
      case '0-5kg (Small Bike)': return fees.parcelSmallFee;
      case '5-20kg (Car)': return fees.parcelMediumFee;
      case '20kg+ (Van)': return fees.parcelLargeFee;
      // Legacy mapping fallback
      case '0-5kg': return fees.parcelSmallFee;
      case '5-20kg': return fees.parcelMediumFee;
      case '20kg+': return fees.parcelLargeFee;
      default: return fees.parcelSmallFee;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptimizeDescription = async () => {
    if (!formData.description) return;
    setIsOptimizing(true);
    const optimized = await optimizeParcelDescription(formData.description);
    setFormData(prev => ({ ...prev, description: optimized }));
    setIsOptimizing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auth Check Logic - Similar to CartPage
    if (!user) {
      sessionStorage.setItem('parcel_temp_data', JSON.stringify(formData));
      navigate('/auth', { state: { from: '/parcels' } });
      return;
    }

    setIsSubmitting(true);

    try {
      const price = getPrice(formData.weight);
      
      // Construct a "virtual" cart item for the parcel
      const parcelItem: CartItem = {
        id: `parcel-${Date.now()}`,
        name: `Parcel: ${formData.weight}`,
        description: formData.description,
        price: price,
        quantity: 1,
        image: '', // No image for parcels
        category: 'Logistics'
      };

      // Construct the Order Object
      const orderData: Omit<Order, 'id'> = {
        userId: user.uid,
        type: 'parcel',
        customerName: formData.senderName,
        customerPhone: formData.senderPhone,
        address: formData.deliveryAddress, // Destination
        pickupAddress: formData.pickupAddress, // Pickup
        recipientName: formData.recipientName,
        instructions: `Pickup at: ${formData.pickupAddress}. Deliver to: ${formData.recipientName}. Content: ${formData.description}`,
        items: [parcelItem],
        total: price,
        status: 'pending',
        assignedDriverId: '',
        createdAt: new Date().toISOString(),
        paymentMethod: 'cash' // Default for parcels for now
      };

      // Save to Firebase 'orders' node so it appears in Admin Dashboard
      const newOrderRef = push(ref(db, 'orders'));
      await set(newOrderRef, orderData);

      // Save/Update User Profile (Sender Details)
      if (user.uid) {
        const userRef = ref(db, `users/${user.uid}`);
        
        if (savePickup && formData.pickupAddress) {
            const addressRef = push(ref(db, `users/${user.uid}/savedAddresses`));
            await set(addressRef, {
              label: 'Saved Address',
              address: formData.pickupAddress
            });
        }

        await update(userRef, {
            name: formData.senderName,
            phone: formData.senderPhone,
            email: user.email,
            lastOrderDate: new Date().toISOString()
        });
      }

      setSubmitted(true);
      window.scrollTo(0, 0);

    } catch (error) {
      console.error("Error creating parcel request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-green-100 text-green-700 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Received!</h2>
        <p className="text-gray-600 mb-8">
          We have received your pickup request. A driver will be assigned shortly to pick up your parcel from:
          <br/>
          <span className="font-bold text-gray-900">{formData.pickupAddress}</span>
        </p>
        <button 
          onClick={() => { setSubmitted(false); setFormData({...formData, description: ''}); }} 
          className="text-brand-blue font-bold hover:underline"
        >
          Send another parcel
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Send a Parcel</h1>
        <p className="text-gray-500 mt-2">Fast, reliable local courier service within West Rand.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        
        {/* Contact Info */}
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Sender Details</h3>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input 
              required
              name="senderName"
              value={formData.senderName}
              onChange={handleChange}
              className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              required
              type="tel"
              name="senderPhone"
              value={formData.senderPhone}
              onChange={handleChange}
              className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="072 123 4567"
            />
          </div>
        </div>

        {/* Addresses */}
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Logistics</h3>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
             <LocationInput 
               label="Pickup Address"
               value={formData.pickupAddress}
               onChange={(val) => setFormData({...formData, pickupAddress: val})}
               placeholder="123 Main St, Krugersdorp"
               enableSave={true}
               onSaveToggle={setSavePickup}
             />
          </div>
          <div>
             <LocationInput 
               label="Delivery Address"
               value={formData.deliveryAddress}
               onChange={(val) => setFormData({...formData, deliveryAddress: val})}
               placeholder="456 Nelson Mandela Dr, Roodepoort"
             />
          </div>
        </div>

        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
            <input 
              required
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="Jane Doe"
            />
        </div>

        {/* Package Details with AI */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <label className="block text-sm font-medium text-brand-dark mb-2 flex items-center justify-between">
            <span>Package Description</span>
            <button 
              type="button"
              onClick={handleOptimizeDescription}
              disabled={!formData.description || isOptimizing}
              className="text-xs flex items-center gap-1 text-brand-blue hover:text-blue-800 font-semibold disabled:opacity-50"
            >
              <SparklesIcon className="w-3 h-3" />
              {isOptimizing ? 'AI is writing...' : 'Formalize with AI'}
            </button>
          </label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none mb-3"
            placeholder="e.g. A box of shoes and some documents"
          />
          
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Weight</label>
          <select 
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none"
          >
            <option>0-5kg (Small Bike)</option>
            <option>5-20kg (Car)</option>
            <option>20kg+ (Van)</option>
          </select>
          <p className="text-right text-sm font-bold text-brand-blue mt-2">
            Estimated Cost: R {getPrice(formData.weight)}
          </p>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-brand-blue hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md disabled:opacity-70"
        >
          {isSubmitting ? 'Submitting...' : (user ? 'Confirm Request' : 'Login to Confirm Request')}
        </button>
      </form>
    </div>
  );
};

export default ParcelsPage;