import React, { useState, useEffect, useRef } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ChevronRight,
  X,
  Send,
  ArrowLeft,
  User,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabase';
import { UserProfile, Ticket, TicketMessage } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface HelpCenterProps {
  user: UserProfile;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Ticket Chat State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();

    // Set up real-time subscription for tickets list
    const ticketsChannel = supabase
      .channel('public:tickets')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [activeTab, user.id]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Real-time subscription for ticket messages
      const channel = supabase
        .channel(`ticket:${selectedTicket.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as TicketMessage]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tickets')
        .select('*, profiles(first_name, last_name, email)')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      // If not admin, only show user's own tickets
      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('tickets')
        .insert([{
          user_id: user.id,
          subject: newTicket.subject,
          description: newTicket.description,
          status: 'active'
        }]);

      if (error) throw error;
      
      setNewTicket({ subject: '', description: '' });
      setShowCreateModal(false);
      if (activeTab === 'active') {
        fetchTickets();
      } else {
        setActiveTab('active');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedTicket || sendingMessage) return;

    try {
      setSendingMessage(true);
      const { error } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          text: messageText.trim()
        }]);

      if (error) throw error;
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'closed') => {
    if (!selectedTicket || user.role !== 'admin') return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      
      setSelectedTicket({ ...selectedTicket, status: newStatus });
      fetchTickets();
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  if (selectedTicket) {
    return (
      <div className="h-full flex flex-col space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400 hover:text-brand bg-gray-50/50"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{selectedTicket.subject}</h2>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  selectedTicket.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedTicket.status === 'active' ? 'Active' : 'Closed'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Ticket ID: #{selectedTicket.id.slice(0, 8)}
                </span>
                <div className="w-1 h-1 rounded-full bg-gray-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Created {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                </span>
                {user.role === 'admin' && selectedTicket.profiles && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                      From: {selectedTicket.profiles.first_name} {selectedTicket.profiles.last_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="flex items-center gap-2">
              {selectedTicket.status === 'active' ? (
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  className="px-6 py-2.5 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                >
                  Close Ticket
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus('active')}
                  className="px-6 py-2.5 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                >
                  Reopen Ticket
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30">
            {/* Original Description */}
            <div className="flex justify-center">
              <div className="max-w-[90%] w-full bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100" />
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-gray-100 rounded-lg text-gray-400">
                    <MessageSquare size={14} />
                  </div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Original Request Description</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{selectedTicket.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand text-[10px] font-bold">
                      {selectedTicket.profiles?.first_name?.[0] || 'U'}
                    </div>
                    <span className="text-[11px] font-bold text-gray-500">
                      {selectedTicket.profiles ? `${selectedTicket.profiles.first_name} ${selectedTicket.profiles.last_name}` : 'User'}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">
                    {new Date(selectedTicket.created_at).toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Message History</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {loadingMessages ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand/10 border-t-brand rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] group`}>
                      <div className={`rounded-3xl p-5 shadow-sm ${
                        msg.sender_id === user.id 
                          ? 'bg-brand text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-2 px-1 ${
                        msg.sender_id === user.id ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={selectedTicket.status === 'closed' ? "This ticket is closed and cannot accept new messages" : "Type your reply here..."}
                  disabled={selectedTicket.status === 'closed' || sendingMessage}
                  className="w-full pl-6 pr-12 py-4 rounded-[24px] border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-sm font-medium disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!messageText.trim() || selectedTicket.status === 'closed' || sendingMessage}
                className="p-4 bg-brand text-white rounded-[24px] hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 disabled:opacity-50 active:scale-95"
              >
                {sendingMessage ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={24} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand/10 rounded-2xl">
              <LifeBuoy className="text-brand" size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Help Center
            </h1>
          </div>
          <p className="text-gray-500 font-medium">
            {user.role === 'admin' ? 'Manage all user tickets and requests.' : "Have questions? Our team is ready to help you 24/7."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all w-full md:w-64 shadow-sm"
            />
          </div>
          {user.role !== 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 bg-brand text-white px-8 py-4 rounded-[20px] font-bold hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={20} />
              Create Ticket
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex p-2 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3.5 text-sm font-bold transition-all rounded-[24px] relative ${
              activeTab === 'active' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Tickets
            {activeTab === 'active' && (
              <motion.div 
                layoutId="active-tab-glow"
                className="absolute inset-0 rounded-[24px] ring-1 ring-black/5" 
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`flex-1 py-3.5 text-sm font-bold transition-all rounded-[24px] relative ${
              activeTab === 'closed' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Closed History
            {activeTab === 'closed' && (
              <motion.div 
                layoutId="active-tab-glow"
                className="absolute inset-0 rounded-[24px] ring-1 ring-black/5" 
              />
            )}
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-brand/10 border-t-brand rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium">Loading tickets...</p>
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredTickets.map((ticket) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="group p-5 rounded-[24px] border border-gray-100 bg-white hover:border-brand/30 hover:shadow-md hover:shadow-brand/5 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`mt-1 p-3 rounded-2xl flex-shrink-0 shadow-sm ${
                        ticket.status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {ticket.status === 'active' ? <Clock size={22} /> : <CheckCircle2 size={22} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="font-black text-gray-900 group-hover:text-brand transition-colors truncate max-w-[200px] sm:max-w-md tracking-tight text-base">
                            {ticket.subject}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${
                              ticket.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {ticket.status === 'active' ? 'Active' : 'Closed'}
                            </span>
                            {user.role === 'admin' && (
                              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-black uppercase tracking-[0.15em] flex items-center gap-1">
                                <Shield size={10} />
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 line-clamp-1 mb-4 font-medium">
                          {ticket.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
                          {user.role === 'admin' && ticket.profiles && (
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-brand" />
                              <span className="text-[11px] font-bold text-gray-700">
                                {ticket.profiles.first_name} {ticket.profiles.last_name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                              ID: {ticket.id.slice(0, 8)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock size={14} className="opacity-50" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                            <div className="flex items-center gap-2 text-brand/70">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand/40 animate-pulse" />
                              <span className="text-[11px] font-bold uppercase tracking-wider">
                                Last activity {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between self-stretch py-1">
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-300 mb-4">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No tickets found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">
                {activeTab === 'active' 
                  ? 'There are no active tickets at the moment.' 
                  : 'Closed tickets history is empty.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">New Ticket</h2>
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Subject</label>
                    <input
                      required
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      placeholder="Briefly describe the issue"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Description</label>
                    <textarea
                      required
                      rows={5}
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      placeholder="Describe your question or issue in detail..."
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={20} />
                        Send Ticket
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpCenter;
