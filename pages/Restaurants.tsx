import React, { useState } from 'react';
import { Restaurant, CartItem } from '../types';
import { SparklesIcon } from '../components/Icons';
import { getFoodRecommendation } from '../services/geminiService';

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: "Mama's Kitchen",
    rating: 4.8,
    cuisine: "Traditional SA",
    deliveryTime: "30-45 min",
    image: "https://picsum.photos/400/300?random=1",
    menu: [
      { id: 'm1', name: 'Kota Special', description: 'Toasted bread, polony, cheese, atchar', price: 45, image: 'https://picsum.photos/200/200?random=10', category: 'Mains' },
      { id: 'm2', name: 'Mogodu & Pap', description: 'Slow cooked tripe with fluffy pap', price: 85, image: 'https://picsum.photos/200/200?random=11', category: 'Mains' }
    ]
  },
  {
    id: '2',
    name: "Burger Bistro",
    rating: 4.5,
    cuisine: "American",
    deliveryTime: "25-40 min",
    image: "https://picsum.photos/400/300?random=2",
    menu: [
      { id: 'b1', name: 'Cheesy Smash', description: 'Double patty, cheddar, pickles', price: 95, image: 'https://picsum.photos/200/200?random=12', category: 'Burgers' },
      { id: 'b2', name: 'Loaded Fries', description: 'Bacon, cheese sauce, jalapenos', price: 55, image: 'https://picsum.photos/200/200?random=13', category: 'Sides' }
    ]
  },
  {
    id: '3',
    name: "Sushi Zen",
    rating: 4.9,
    cuisine: "Japanese",
    deliveryTime: "40-60 min",
    image: "https://picsum.photos/400/300?random=3",
    menu: [
      { id: 's1', name: 'Salmon Roses', description: '4pc Fresh Salmon roses with mayo', price: 89, image: 'https://picsum.photos/200/200?random=14', category: 'Sushi' }
    ]
  }
];

interface Props {
  addToCart: (item: CartItem) => void;
}

const RestaurantsPage: React.FC<Props> = ({ addToCart }) => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [aiMood, setAiMood] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiSuggest = async () => {
    if (!aiMood.trim()) return;
    setLoadingAi(true);
    const suggestion = await getFoodRecommendation(aiMood);
    setAiSuggestion(suggestion);
    setLoadingAi(false);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_RESTAURANTS.map((restaurant) => (
              <div 
                key={restaurant.id} 
                onClick={() => setSelectedRestaurant(restaurant)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-64 object-cover rounded-xl shadow-lg mb-4"/>
                <h1 className="text-3xl font-bold text-gray-900">{selectedRestaurant.name}</h1>
                <p className="text-gray-500 mb-2">{selectedRestaurant.cuisine}</p>
                <p className="text-sm text-gray-400">Delivers in {selectedRestaurant.deliveryTime}</p>
             </div>

             <div className="md:w-2/3">
               <h2 className="text-xl font-bold mb-4 border-b pb-2">Menu</h2>
               <div className="space-y-4">
                  {selectedRestaurant.menu.map(item => (
                    <div key={item.id} className="flex bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-brand-red/30 transition-colors">
                      <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100"/>
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
                  ))}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsPage;
