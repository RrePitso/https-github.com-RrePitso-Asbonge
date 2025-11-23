import React, { useState, useRef } from 'react';
import { CameraIcon, UploadIcon, XIcon } from './Icons';

interface ImageUploaderProps {
  currentImage?: string;
  onImageSelected: (base64: string) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageSelected, label = "Upload Image" }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize logic to prevent DB bloat (Max 500x500)
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to base64 (JPEG 0.7 quality is good balance)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            onImageSelected(dataUrl);
        }
        setIsProcessing(false);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      <div className="flex items-start gap-4">
        {currentImage ? (
          <div className="relative group">
            <img 
              src={currentImage} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" 
            />
            <button
              type="button"
              onClick={() => onImageSelected('')}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
             <CameraIcon className="w-8 h-8" />
          </div>
        )}

        <div className="flex-grow">
           <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef}
             onChange={handleFileChange}
             className="hidden" 
           />
           <button 
             type="button"
             disabled={isProcessing}
             onClick={() => fileInputRef.current?.click()}
             className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50"
           >
             {isProcessing ? 'Processing...' : (
                <>
                   <UploadIcon className="w-4 h-4" />
                   {currentImage ? 'Change Image' : 'Select Image'}
                </>
             )}
           </button>
           <p className="text-xs text-gray-500 mt-2">
             Uploads are automatically resized for optimization.
           </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;