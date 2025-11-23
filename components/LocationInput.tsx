import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { SavedAddress } from '../types';

// Icons inline
const LocationMarkerIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableSave?: boolean;
  onSaveToggle?: (save: boolean) => void;
}

const LocationInput: React.FC<Props> = ({ label, value, onChange, placeholder, enableSave, onSaveToggle }) => {
  const { user } = useAuth();
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showSaveOption, setShowSaveOption] = useState(false);
  
  // Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load Saved Addresses
  useEffect(() => {
    if (user) {
      const savedRef = ref(db, `users/${user.uid}/savedAddresses`);
      const unsub = onValue(savedRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list = Array.isArray(data) ? data : Object.values(data);
          setSavedAddresses(list as SavedAddress[]);
        }
      });
      return () => unsub();
    }
  }, [user]);

  // Handle Click Outside for Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Debounce and Fetch Suggestions from OpenStreetMap
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && value.length > 3 && showSuggestions) {
        fetchSuggestions(value);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [value, showSuggestions]);

  const fetchSuggestions = async (query: string) => {
    try {
      // Nominatim API for South Africa (countrycodes=za)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=za&limit=5&addressdetails=1`);
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Reverse Geocoding with OpenStreetMap
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        if (data && data.display_name) {
             onChange(data.display_name);
        } else {
             onChange(`${latitude}, ${longitude}`);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        onChange(`${latitude}, ${longitude}`);
      } finally {
        setLoadingLoc(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve your location. Please check permissions.");
      setLoadingLoc(false);
    });
  };

  const handleSelectSaved = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected) {
      onChange(selected);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    onChange(suggestion.display_name);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <div className="mb-4 relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      {/* Input Group */}
      <div className="relative flex items-center">
        <input 
          required
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          className="w-full border border-gray-300 rounded-lg pl-10 pr-12 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none z-10 relative bg-transparent placeholder-gray-400"
          placeholder={placeholder || "Street address, suburb..."}
          autoComplete="off"
        />
        <div className="absolute left-3 text-gray-400 z-10">
           <LocationMarkerIcon className="w-5 h-5" />
        </div>
        <button 
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loadingLoc}
          className="absolute right-2 top-1.5 p-1 bg-gray-100 hover:bg-gray-200 rounded-md text-brand-blue transition-colors z-20"
          title="Use current location"
        >
          {loadingLoc ? <div className="animate-spin h-5 w-5 border-2 border-brand-blue border-t-transparent rounded-full" /> : <TargetIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
          <ul>
            {suggestions.map((item: any, index: number) => (
              <li 
                key={index}
                onClick={() => handleSelectSuggestion(item)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 text-sm text-gray-700 flex items-start gap-2"
              >
                <LocationMarkerIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{item.display_name}</span>
              </li>
            ))}
          </ul>
          <div className="bg-gray-50 px-2 py-1 text-right">
             <span className="text-[10px] text-gray-400">Powered by OpenStreetMap</span>
          </div>
        </div>
      )}

      {/* Helper Options */}
      <div className="flex justify-between items-center mt-2">
         {/* Saved Addresses Dropdown */}
         {user && savedAddresses.length > 0 && (
           <select 
             onChange={handleSelectSaved} 
             className="text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50 text-gray-600 outline-none hover:border-gray-300 cursor-pointer max-w-[60%]"
             defaultValue=""
           >
             <option value="" disabled>Load saved address...</option>
             {savedAddresses.map((addr, idx) => (
               <option key={idx} value={addr.address}>{addr.label || addr.address.substring(0, 20)}</option>
             ))}
           </select>
         )}

         {/* Save Checkbox */}
         {enableSave && user && value && (
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer ml-auto">
              <input 
                type="checkbox" 
                checked={showSaveOption} 
                onChange={(e) => {
                  setShowSaveOption(e.target.checked);
                  if (onSaveToggle) onSaveToggle(e.target.checked);
                }}
                className="rounded text-brand-blue focus:ring-brand-blue"
              />
              Save for future use
            </label>
         )}
      </div>
    </div>
  );
};

export default LocationInput;