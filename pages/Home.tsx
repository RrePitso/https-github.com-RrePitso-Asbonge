import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsIcon, TruckIcon } from '../components/Icons';

const HomePage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-brand-dark text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/1600/900" 
            alt="Background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Delivering Happiness <br />
            <span className="text-brand-red">Across West Rand</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl">
            From your favorite local restaurants to essential parcel deliveries. 
            Asbonge Eats connects you with what you need, fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/restaurants" className="px-8 py-4 bg-brand-red hover:bg-red-600 rounded-lg font-bold text-lg text-center transition-colors shadow-lg">
              Order Food
            </Link>
            <Link to="/parcels" className="px-8 py-4 bg-white text-brand-dark hover:bg-gray-100 rounded-lg font-bold text-lg text-center transition-colors shadow-lg">
              Send a Parcel
            </Link>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Services</h2>
            <p className="mt-4 text-lg text-gray-500">Choose how we can help you today</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Food Delivery Card */}
            <div className="group relative bg-gray-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="absolute top-6 right-6 bg-orange-100 p-3 rounded-full">
                <UtensilsIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Food Delivery</h3>
              <p className="text-gray-600 mb-6">
                Browse menus from top rated restaurants in West Rand. 
                From fast food to fine dining, we bring the flavor to your door.
              </p>
              <Link to="/restaurants" className="inline-flex items-center text-brand-red font-semibold hover:underline">
                Browse Restaurants &rarr;
              </Link>
            </div>

            {/* Parcel Service Card */}
            <div className="group relative bg-gray-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="absolute top-6 right-6 bg-blue-100 p-3 rounded-full">
                <TruckIcon className="w-8 h-8 text-brand-blue" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Parcel Logistics</h3>
              <p className="text-gray-600 mb-6">
                Need to send a package? Our reliable courier service ensures your 
                parcels reach their destination safely and on time.
              </p>
              <Link to="/parcels" className="inline-flex items-center text-brand-blue font-semibold hover:underline">
                Request Pickup &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial / Trust */}
      <div className="bg-brand-light py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-brand-dark mb-8">Trusted by West Rand Locals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale">
            <div className="font-black text-xl">BURGER KING</div>
            <div className="font-black text-xl">NANDO'S</div>
            <div className="font-black text-xl">KFC</div>
            <div className="font-black text-xl">ROCOMAMAS</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
