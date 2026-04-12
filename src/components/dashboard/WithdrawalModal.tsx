import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw?: (amount: number, method: string) => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, balance, onWithdraw }) => {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call to create withdrawal request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      if (onWithdraw) {
        onWithdraw(Number(amount), method);
      }
      
      // Close after showing success message
      setTimeout(() => {
        setIsSuccess(false);
        setAmount('');
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Withdraw Funds</h2>
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {isSuccess ? (
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-1">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Request Sent!</h3>
              <p className="text-gray-500 text-xs">
                Your withdrawal request for ${amount} has been created and is awaiting approval.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="bg-indigo-50 p-3 rounded-xl flex items-center justify-between border border-indigo-100">
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Available Balance</p>
                  <p className="text-xl font-extrabold text-gray-900">${balance.toLocaleString('en-US')}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                  <DollarSign size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Withdrawal Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold text-xs">$</span>
                    </div>
                    <input 
                      type="number" 
                      required
                      min="50"
                      max={balance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-7 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#4338CA] outline-none transition-all font-bold text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">Minimum amount: $50</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Withdrawal Method</label>
                  <select 
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#4338CA] outline-none transition-all font-medium text-xs text-gray-700"
                  >
                    <option value="bank_transfer">Bank Transfer (2-3 business days)</option>
                    <option value="paypal">PayPal (Instant)</option>
                    <option value="crypto">Crypto Wallet (USDT)</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !amount || Number(amount) > balance || Number(amount) < 50}
                  className="w-full bg-[#4338CA] text-white py-2.5 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Send Request'
                  )}
                </button>
              </div>
            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WithdrawalModal;
