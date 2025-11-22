import React, { useState } from 'react';
import { SparklesIcon } from '../components/Icons';
import { optimizeParcelDescription } from '../services/geminiService';

const ParcelsPage = () => {
  const [formData, setFormData] = useState({
    senderName: '',
    pickupAddress: '',
    recipientName: '',
    deliveryAddress: '',
    description: '',
    weight: '0-5kg',
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-green-100 text-green-700 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Received!</h2>
        <p className="text-gray-600 mb-8">We have received your pickup request. A driver will be assigned shortly to pick up your parcel from {formData.pickupAddress}.</p>
        <button onClick={() => setSubmitted(false)} className="text-brand-blue font-bold hover:underline">Send another parcel</button>
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
        {/* Addresses */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
            <input 
              required
              name="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleChange}
              className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="123 Main St, Krugersdorp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <input 
              required
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="456 Nelson Mandela Dr, Roodepoort"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
            <input 
              required
              name="senderName"
              value={formData.senderName}
              onChange={handleChange}
              className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
            <input 
              required
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
            />
          </div>
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
        </div>

        <button type="submit" className="w-full bg-brand-blue hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md">
          Request Pickup
        </button>
      </form>
    </div>
  );
};

export default ParcelsPage;
