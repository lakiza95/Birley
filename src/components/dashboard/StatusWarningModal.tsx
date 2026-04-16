import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Lock, X } from 'lucide-react';

interface StatusWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'incomplete' | 'automated';
  missingFields?: string[];
}

const StatusWarningModal: React.FC<StatusWarningModalProps> = ({ isOpen, onClose, title, message, type, missingFields }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  type === 'automated' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {type === 'automated' ? <Lock size={24} /> : <AlertCircle size={24} />}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {message}
                </p>

                {missingFields && missingFields.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Missing Fields:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {missingFields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StatusWarningModal;
