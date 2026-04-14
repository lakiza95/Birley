import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical, 
  User, 
  Building2, 
  Inbox as InboxIcon,
  UserPlus,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat, Message, UserProfile } from '../../types';
import { supabase } from '../../supabase';
import { formatDistanceToNow } from 'date-fns';

interface InboxProps {
  user: UserProfile;
  setActiveTab: (tab: string) => void;
  setSelectedStudentId: (id: string) => void;
  setSelectedApplicationId: (id: string) => void;
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
}

const Inbox: React.FC<InboxProps> = ({ 
  user, 
  setActiveTab, 
  setSelectedStudentId, 
  setSelectedApplicationId,
  selectedChatId,
  setSelectedChatId
}) => {
  const [activeCategory] = useState<'school'>('school');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchChats();

    // Set up real-time subscription for chats list
    const chatsChannel = supabase
      .channel('public:chats')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chats' 
      }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatsChannel);
    };
  }, [user.id]);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`chat:${selectedChatId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${selectedChatId}`
        }, (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            text: payload.new.text,
            timestamp: formatDistanceToNow(new Date(payload.new.created_at), { addSuffix: true })
          };
          setMessages(prev => [...prev, newMessage]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChatId]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('chats')
        .select(`
          *,
          recruiter:profiles!recruiter_id (first_name, last_name, email),
          applications (
            id,
            student_id,
            students (name),
            programs (
              name,
              institutions (name)
            )
          ),
          messages (
            text,
            created_at
          )
        `);

      if (user.role === 'admin') {
        query = query.eq('admin_id', user.id);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

        const mappedChats: Chat[] = (data || []).map(chat => {
          const lastMsg = chat.messages && chat.messages.length > 0 
            ? chat.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            : null;

          const lastMessageText = lastMsg?.text || 'No messages yet';
          const isSystem = lastMessageText.includes('__SYSTEM_NOTIFICATION__') || 
                          lastMessageText.toLowerCase().includes('administrator has been added') ||
                          lastMessageText.toLowerCase().includes('administrator has left');
          const displayLastMessage = isSystem 
            ? lastMessageText.replace('__SYSTEM_NOTIFICATION__ ', '').replace('__SYSTEM_NOTIFICATION__', '')
            : lastMessageText;

          const clean = (val: any) => (val === 'undefined' || val === 'null' || !val) ? '' : val;
          const firstName = clean(chat.recruiter?.first_name);
          const lastName = clean(chat.recruiter?.last_name);
          const recruiterName = `${firstName} ${lastName}`.trim() || chat.recruiter?.email || 'Unknown Recruiter';
          
          const schoolName = clean(chat.applications?.programs?.institutions?.name) || 'Unknown Institution';

          return {
            id: chat.id,
            type: 'school',
            participants: [chat.recruiter_id, chat.institution_id],
            adminId: chat.admin_id,
            lastMessage: displayLastMessage,
            lastMessageTime: lastMsg ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true }) : '',
            unreadCount: 0,
            studentName: clean(chat.applications?.students?.name) || 'Unknown',
            studentId: chat.applications?.student_id,
            applicationId: `APP-${chat.applications?.id?.slice(0, 4).toUpperCase()}`,
            dbApplicationId: chat.applications?.id,
            schoolName: user.role === 'institution' ? recruiterName : schoolName
          };
        });

      setChats(mappedChats);
      // Only set initial chat if none is selected
      if (mappedChats.length > 0 && !selectedChatId) {
        setSelectedChatId(mappedChats[0].id);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        text: msg.text,
        timestamp: formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })
      }));

      setMessages(mappedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

    const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChatId || isSending) return;

    const cleanText = messageText.trim().replace(/^__SYSTEM_NOTIFICATION__\s*/, '');
    if (!cleanText) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: selectedChatId,
          sender_id: user.id,
          text: cleanText
        }]);

      if (error) throw error;

      // Update chat updated_at
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChatId);

      setMessageText('');
      // Message will be added via real-time subscription
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedChatId) return;
    
    try {
      // Find an available admin
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (adminError) throw adminError;
      if (!admins || admins.length === 0) {
        alert('No administrators available');
        return;
      }

      const { error: updateError } = await supabase
        .from('chats')
        .update({ admin_id: admins[0].id })
        .eq('id', selectedChatId);

      if (updateError) throw updateError;
      
      // Send a system message
      await supabase.from('messages').insert({
        chat_id: selectedChatId,
        sender_id: user.id,
        text: '__SYSTEM_NOTIFICATION__ An administrator has been added to the chat.'
      });

      fetchChats();
    } catch (err) {
      console.error('Error adding admin:', err);
      alert('Failed to add administrator');
    }
  };

  const handleLeaveChat = async () => {
    if (!selectedChatId || user.role !== 'admin') return;

    try {
      const { error: updateError } = await supabase
        .from('chats')
        .update({ admin_id: null })
        .eq('id', selectedChatId);

      if (updateError) throw updateError;

      // Send a system message
      await supabase.from('messages').insert({
        chat_id: selectedChatId,
        sender_id: user.id,
        text: '__SYSTEM_NOTIFICATION__ Administrator has left the chat.'
      });

      setSelectedChatId(null);
      fetchChats();
    } catch (err) {
      console.error('Error leaving chat:', err);
      alert('Failed to leave chat');
    }
  };

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm mx-auto max-w-6xl w-full">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
            <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg">
              <InboxIcon size={16} />
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-[10px] font-medium">Loading...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-300 text-[10px] font-medium uppercase tracking-wider">No messages</p>
            </div>
          ) : chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`w-full p-3 flex gap-3 rounded-xl transition-all relative group ${
                selectedChatId === chat.id 
                  ? 'bg-indigo-50/50' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedChatId === chat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Building2 size={18} />
                </div>
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-start">
                  <h3 className={`text-xs font-bold truncate ${
                    selectedChatId === chat.id ? 'text-indigo-900' : 'text-gray-700'
                  }`}>
                    {chat.schoolName}
                  </h3>
                  <span className="text-[9px] font-medium text-gray-400 whitespace-nowrap ml-2">
                    {chat.lastMessageTime}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-tight truncate">
                    {chat.studentName}
                  </span>
                </div>
                
                <p className={`text-[11px] truncate mt-0.5 ${
                  selectedChatId === chat.id ? 'text-indigo-600/70' : 'text-gray-400'
                }`}>
                  {chat.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3 bg-white border-b border-gray-50 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-400">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {selectedChat.schoolName}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if (selectedChat.studentId) {
                          setSelectedStudentId(selectedChat.studentId);
                          setActiveTab('student-detail');
                        }
                      }}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      {selectedChat.studentName}
                    </button>
                    <span className="text-gray-200 text-[10px]">•</span>
                    <button 
                      onClick={() => {
                        if (selectedChat.dbApplicationId) {
                          setSelectedApplicationId(selectedChat.dbApplicationId);
                          setActiveTab('applications');
                        }
                      }}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {selectedChat.applicationId}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {user.role === 'admin' ? (
                  <button 
                    onClick={handleLeaveChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all"
                  >
                    <LogOut size={12} />
                    Leave
                  </button>
                ) : !selectedChat.adminId && (
                  <button 
                    onClick={handleAddAdmin}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all"
                  >
                    <UserPlus size={12} />
                    Add Admin
                  </button>
                )}
                <button className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition-all">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {messages.map((msg) => {
                const isSystem = msg.text.includes('__SYSTEM_NOTIFICATION__') || 
                                msg.text.toLowerCase().includes('administrator has been added') ||
                                msg.text.toLowerCase().includes('administrator has left');
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="text-gray-500 text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
                        {msg.text.replace('__SYSTEM_NOTIFICATION__ ', '').replace('__SYSTEM_NOTIFICATION__', '')}
                      </div>
                    </div>
                  );
                }
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] group`}>
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="text-xs leading-relaxed font-medium">{msg.text}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[8px] font-medium text-gray-400 uppercase">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-3xl mx-auto w-full">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Message..."
                    disabled={isSending}
                    className="w-full pl-5 pr-10 py-3 bg-gray-50 border-none rounded-2xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-100 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSending || !messageText.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mb-4">
              <InboxIcon size={32} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Select a conversation</h3>
            <p className="text-[11px] font-medium text-gray-400">Choose a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
