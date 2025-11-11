"use client";
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  details?: string;
}

export function ResultModal({ 
  isOpen, 
  onClose, 
  type,
  title,
  message,
  details
}: ResultModalProps) {
  const icon = type === 'success' 
    ? <CheckCircle className="w-10 h-10 text-green-600" />
    : <XCircle className="w-10 h-10 text-red-600" />;
  
  const iconBg = type === 'success' 
    ? 'bg-green-100' 
    : 'bg-red-100';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        {details && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
            <p className="text-xs text-gray-600 font-medium mb-1">Details:</p>
            <p className="text-xs text-gray-500">{details}</p>
          </div>
        )}
        <button
          onClick={onClose}
          className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
            type === 'success'
              ? 'bg-primary text-black hover:shadow-md hover:scale-[1.02]'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {type === 'success' ? 'OK' : 'Close'}
        </button>
      </div>
    </Modal>
  );
}


