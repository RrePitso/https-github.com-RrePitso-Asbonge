import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { TruckIcon, UtensilsIcon, StarIcon, CheckCircleIcon } from '../components/Icons';
import { Link } from 'react-router-dom';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review State
  const [reviewingOrder, setReviewingOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user) return;

    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Client-side filtering for simplicity given the dataset size
        // In production, you'd use orderByChild('userId').equalTo(user.uid) with an index
        const myOrders = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter((order: any) => order.userId === user.uid)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
        setOrders(myOrders as Order[]);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmitReview = async (orderId: string) => {
    setSubmittingReview(true);
    try {
        await update(ref(db, `orders/${orderId}`), {
            rating,
            feedback
        });
        setReviewingOrder(null);
        setFeedback('');
        setRating(5);
    } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review");
    } finally {
        setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading your orders...</div>;
  }

  if (!user) {
    return (
        <div className="p-10 text-center">
            <h2 className="text-xl font-bold">Please log in to view orders</h2>
            <Link to="/auth" className="text-brand-red font-bold underline">Login</Link>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Order History</h1>

      {orders.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-gray-100">
           <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
           <Link to="/restaurants" className="bg-brand-red text-white px-6 py-2 rounded-lg font-bold">Start Ordering</Link>
        </div>
      ) : (
        <div className="space-y-6">
           {orders.map(order => (
             <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                
                {/* Header */}
                <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-100">
                   <div className="flex items-center gap-3">
                      {order.type === 'parcel' ? (
                          <div className="bg-blue-100 p-2 rounded-full text-blue-800"><TruckIcon className="w-5 h-5"/></div>
                      ) : (
                          <div className="bg-orange-100 p-2 rounded-full text-orange-800"><UtensilsIcon className="w-5 h-5"/></div>
                      )}
                      <div>
                          <div className="font-bold text-gray-900">
                             {order.type === 'parcel' ? 'Parcel Delivery' : 'Food Order'}
                          </div>
                          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                   </div>
                   <div className="text-right">
                       <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                           order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                           order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                           'bg-yellow-100 text-yellow-800'
                       }`}>
                           {order.status}
                       </span>
                       <div className="text-sm font-bold mt-1">R {order.total}</div>
                   </div>
                </div>

                {/* Content */}
                <div className="p-4">
                   <p className="text-sm text-gray-600 mb-2"><strong>To:</strong> {order.address}</p>
                   {order.items && order.items.length > 0 && (
                       <div className="text-sm text-gray-500">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                       </div>
                   )}
                </div>

                {/* Review Section (Only if Delivered) */}
                {order.status === 'delivered' && (
                    <div className="px-4 pb-4">
                        {order.rating ? (
                            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <div className="flex text-yellow-400 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className="w-4 h-4" filled={i < order.rating!} />
                                        ))}
                                    </div>
                                    {order.feedback && <p className="text-sm text-gray-600 italic">"{order.feedback}"</p>}
                                </div>
                                <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                                    <CheckCircleIcon className="w-4 h-4"/> Reviewed
                                </div>
                            </div>
                        ) : (
                            reviewingOrder === order.id ? (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                                    <h4 className="font-bold text-gray-900 mb-2">Rate your Driver</h4>
                                    <div className="flex gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star} 
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`${rating >= star ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}
                                            >
                                                <StarIcon className="w-8 h-8" filled={true} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea 
                                        className="w-full border rounded p-2 text-sm mb-2"
                                        placeholder="How was the service?"
                                        rows={2}
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => setReviewingOrder(null)}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => handleSubmitReview(order.id)}
                                            disabled={submittingReview}
                                            className="bg-brand-dark text-white text-sm px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setReviewingOrder(order.id)}
                                    className="text-sm text-brand-blue font-bold hover:underline flex items-center gap-1"
                                >
                                    <StarIcon className="w-4 h-4" /> Rate this Order
                                </button>
                            )
                        )}
                    </div>
                )}
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;