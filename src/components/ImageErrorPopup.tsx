import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ImageErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  retailer?: string;
}

export const ImageErrorPopup: React.FC<ImageErrorPopupProps> = ({
  isOpen,
  onClose,
  productTitle,
  retailer
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Image Loading Issue
              </h3>
              <p className="text-gray-600 mb-4">
                Sorry, right now we are facing an issue loading the product image
                {productTitle && (
                  <span className="block mt-1 text-sm text-gray-500">
                    for "{productTitle}"
                  </span>
                )}
                {retailer && (
                  <span className="block mt-1 text-sm text-gray-500">
                    from {retailer.charAt(0).toUpperCase() + retailer.slice(1)}
                  </span>
                )}
              </p>
              
              <Alert className="mb-4">
                <AlertDescription className="text-sm">
                  Don't worry! You can still view the product details and make purchases. 
                  The image issue is temporary and will be resolved soon.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="text-sm"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
