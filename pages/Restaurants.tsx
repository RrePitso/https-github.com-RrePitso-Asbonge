import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { Restaurant, CartItem } from '../types';
import { SparklesIcon } from '../components/Icons';
import { getFoodRecommendation } from '../services/geminiService';

interface Props {
  addToCart: (item: CartItem) => void;
}

const RestaurantsPage: React.FC<Props> = ({ addToCart }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [aiMood, setAiMood] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const restaurantsRef = ref(db, 'restaurants');
        const snapshot = await get(restaurantsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Convert Object of Objects to Array
          const fetchedRestaurants = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })) as Restaurant[];
          setRestaurants(fetchedRestaurants);
        } else {
          setRestaurants([]);
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handleAiSuggest = async () => {
    if (!aiMood.trim()) return;
    setLoadingAi(true);
    const suggestion = await getFoodRecommendation(aiMood);
    setAiSuggestion(suggestion);
    setLoadingAi(false);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* AI Assistant Section */}
      <div className="bg-gradient-to-r from-brand-dark to-brand-blue rounded-2xl p-6 mb-12 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <SparklesIcon className="w-6 h-6 text-yellow-300" />
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-bold mb-2">Not sure what to eat?</h2>
            <p className="text-sm text-gray-200 mb-4">Tell our AI Concierge what you're craving (e.g., "Something spicy", "Comfort food", "Healthy lunch")</p>
            
            <div className="flex gap-2 max-w-lg">
              <input 
                type="text" 
                value={aiMood}
                onChange={(e) => setAiMood(e.target.value)}
                placeholder="I'm feeling..."
                className="flex-grow px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
              <button 
                onClick={handleAiSuggest}
                disabled={loadingAi}
                className="px-4 py-2 bg-brand-red rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loadingAi ? 'Asking...' : 'Suggest'}
              </button>
            </div>

            {aiSuggestion && (
              <div className="mt-4 bg-white/10 p-4 rounded-lg border border-white/20 animate-fade-in">
                <p className="italic">"{aiSuggestion}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Grid or Menu View */}
      {!selectedRestaurant ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Restaurants in West Rand</h2>
          {restaurants.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No restaurants available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {restaurants.map((restaurant) => (
                <div 
                  key={restaurant.id} 
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-gray-100"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img src={restaurant.image || 'https://via.placeholder.com/400x300'} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                      {restaurant.deliveryTime}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                        {restaurant.rating} ★
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">{restaurant.cuisine}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Menu View
        <div className="animate-fade-in">
          <button 
            onClick={() => setSelectedRestaurant(null)}
            className="mb-6 text-gray-500 hover:text-brand-red flex items-center gap-2"
          >
            &larr; Back to Restaurants
          </button>
          
          <div className="flex flex-col md:flex-row gap-8">
             <div className="md:w-1/3">
                <img src={selectedRestaurant.image || 'https://via.placeholder.com/400x300'} alt={selectedRestaurant.name} className="w-full h-64 object-cover rounded-xl shadow-lg mb-4"/>
                <h1 className="text-3xl font-bold text-gray-900">{selectedRestaurant.name}</h1>
                <p className="text-gray-500 mb-2">{selectedRestaurant.cuisine}</p>
                <p className="text-sm text-gray-400">Delivers in {selectedRestaurant.deliveryTime}</p>
             </div>

             <div className="md:w-2/3">
               <h2 className="text-xl font-bold mb-4 border-b pb-2">Menu</h2>
               <div className="space-y-4">
                  {!selectedRestaurant.menu || selectedRestaurant.menu.length === 0 ? (
                    <p className="text-gray-500 italic">Menu items currently unavailable.</p>
                  ) : (
                    selectedRestaurant.menu.map(item => (
                      <div key={item.id} className="flex bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-brand-red/30 transition-colors">
                        <img src={item.image || 'https://via.placeholder.com/200'} alt={item.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100"/>
                        <div className="ml-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-brand-red">R {item.price}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart({ ...item, quantity: 1 });
                              }}
                              className="bg-brand-dark text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                              Add +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsPage;