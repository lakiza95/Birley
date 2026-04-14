import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  GraduationCap, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Mail,
  Globe,
  Send,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { supabase } from '../../supabase';
import { UserProfile } from '../../types';
import RecruiterProfileModal from './RecruiterProfileModal';

interface ApplicationCardProps {
  application: any;
  user: UserProfile;
  onClose: () => void;
  onStatusUpdate?: () => void;
  backLabel?: string;
  onViewStudent?: () => void;
  setActiveTab?: (tab: string) => void;
  setSelectedChatId?: (id: string | null) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  user, 
  onClose, 
  onStatusUpdate, 
  backLabel = "Back to Applications", 
  onViewStudent,
  setActiveTab,
  setSelectedChatId
}) => {
  if (!application) return null;

  const [isUpdating, setIsUpdating] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isRecruiterModalOpen, setIsRecruiterModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCheckingChat, setIsCheckingChat] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (!application.student_id) return;
      setIsLoadingDocs(true);
      try {
        // Fetch documents
        const { data: docs, error: docsError } = await supabase
          .from('student_documents')
          .select('*')
          .eq('student_id', application.student_id);
        if (docsError) throw docsError;
        setDocuments(docs || []);

        // Fetch student details
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', application.student_id)
          .single();
        if (studentError) throw studentError;
        setStudentDetails(student);
      } catch (err) {
        console.error('Error fetching application details:', err);
      } finally {
        setIsLoadingDocs(false);
      }
    };
    fetchDetails();
  }, [application.student_id]);

  const handleChatAction = async () => {
    if (!application.db_id) return;
    
    setIsCheckingChat(true);
    try {
      // Check if chat exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('application_id', application.db_id)
        .maybeSingle();

      if (chatError) throw chatError;

      if (existingChat) {
        // Chat exists, open it
        if (setSelectedChatId && setActiveTab) {
          setSelectedChatId(existingChat.id);
          setActiveTab('inbox');
        }
      } else {
        // Chat doesn't exist, open message modal
        setIsMessageModalOpen(true);
      }
    } catch (err) {
      console.error('Error checking chat:', err);
      alert('Failed to check chat status.');
    } finally {
      setIsCheckingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !application.institution_id) return;

    setIsSending(true);
    try {
      // 1. Double check if chat exists (to avoid race conditions)
      let { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('application_id', application.db_id)
        .maybeSingle();

      let chatId;

      if (!existingChat) {
        // Chat doesn't exist, create it
        const chatData: any = {
          application_id: application.db_id,
          institution_id: application.institution_id
        };
        if (application.recruiter_id) {
          chatData.recruiter_id = application.recruiter_id;
        }

        const { data: newChat, error: createChatError } = await supabase
          .from('chats')
          .insert([chatData])
          .select()
          .single();

        if (createChatError) throw createChatError;
        chatId = newChat.id;
      } else {
        chatId = existingChat.id;
      }

      // 2. Insert message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          sender_id: user.id,
          text: messageText.trim()
        }]);

      if (messageError) throw messageError;

      // 3. Update chat updated_at
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      setIsMessageModalOpen(false);
      setMessageText('');
      
      // After sending first message, open the chat
      if (setSelectedChatId && setActiveTab) {
        setSelectedChatId(chatId);
        setActiveTab('inbox');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    if (application.payment_link) {
      navigator.clipboard.writeText(application.payment_link);
      alert('Payment link copied!');
    } else {
      alert('Payment link is missing.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application.db_id) return;
    
    // Restrict recruiters from changing status to anything other than Cancelled
    if (user.role === 'partner' && newStatus !== 'Cancelled') {
      alert('Recruiters can only cancel applications.');
      return;
    }
    
    if (newStatus === 'Action Required') {
      setIsActionModalOpen(true);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', application.db_id);

      if (error) {
        throw error;
      }
      
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error('Error updating application status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const submitActionRequired = async () => {
    if (!application.db_id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'Action Required' })
        .eq('id', application.db_id);

      if (error) throw error;

      // Send the message to the chat
      if (actionMessage.trim()) {
        let { data: existingChat } = await supabase
          .from('chats')
          .select('id')
          .eq('application_id', application.db_id)
          .maybeSingle();

        let chatId = existingChat?.id;

        if (!chatId) {
          const chatData: any = {
            application_id: application.db_id,
            institution_id: application.institution_id
          };
          if (application.recruiter_id) {
            chatData.recruiter_id = application.recruiter_id;
          }

          console.log('Creating chat with data:', chatData);

          const { data: newChat, error: createError } = await supabase
            .from('chats')
            .insert(chatData)
            .select()
            .single();
            
          if (createError) throw createError;
          chatId = newChat.id;
        }

        if (chatId) {
          const { error: msgError } = await supabase
            .from('messages')
            .insert({
              chat_id: chatId,
              sender_id: user.id,
              text: actionMessage
            });
            
          if (msgError) throw msgError;
        }
      }
      
      setIsActionModalOpen(false);
      setActionMessage('');
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error('Error updating application status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors: any = {
    'New application': 'bg-gray-50 text-gray-500 border-gray-100',
    'In review': 'bg-blue-50 text-blue-600 border-blue-100',
    'Action Required': 'bg-amber-50 text-amber-600 border-amber-100',
    'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100',
    'Waiting payment': 'bg-orange-50 text-orange-600 border-orange-100',
    'Payment received': 'bg-teal-50 text-teal-600 border-teal-100',
    'Ready for visa': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    'Visa Approved': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Done': 'bg-green-100 text-green-700 border-green-200',
    'Refund': 'bg-rose-50 text-rose-600 border-rose-100',
    // Legacy support
    'Submitted': 'bg-gray-50 text-gray-500 border-gray-100',
    'Reviewing': 'bg-blue-50 text-blue-600 border-blue-100',
    'Accepted': 'bg-green-50 text-green-600 border-green-100',
    'Under Review': 'bg-blue-50 text-blue-600 border-blue-100',
    'Paid': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Documents Issued': 'bg-purple-50 text-purple-600 border-purple-100',
  };

  const statusIcons: any = {
    'New application': Clock,
    'In review': Clock,
    'Action Required': AlertCircle,
    'Approved': CheckCircle2,
    'Rejected': AlertCircle,
    'Waiting payment': Clock,
    'Payment received': CheckCircle2,
    'Ready for visa': FileText,
    'Visa Approved': CheckCircle2,
    'Done': CheckCircle2,
    'Refund': AlertCircle,
    // Legacy support
    'Submitted': Clock,
    'Reviewing': Clock,
    'Accepted': CheckCircle2,
    'Under Review': Clock,
    'Paid': CheckCircle2,
    'Documents Issued': FileText,
  };

  const StatusIcon = statusIcons[application.status] || Clock;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-8"
    >
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-[#4338CA] font-bold transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center group-hover:border-indigo-100 shadow-sm">
            <X size={16} className="rotate-0 group-hover:rotate-90 transition-transform" />
          </div>
          <span className="text-sm">{backLabel === "Back to Applications" ? "Back to Applications" : "Back to Student Profile"}</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-xl shadow-sm transition-all">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        {/* Top Banner Info */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${statusColors[application.status] || 'bg-gray-100 text-gray-500'} border shadow-sm`}>
              <StatusIcon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{application.id}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[application.status]}`}>
                  {application.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">Submitted {application.date}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Student & Program Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Student Info */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Student Information</h3>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#4338CA] flex items-center justify-center text-xl font-bold border border-indigo-100">
                    {application.student.split(' ').map((n: any) => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{application.student}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{application.student_email || studentDetails?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe size={14} className="text-gray-400" />
                        <span>{application.student_country || studentDetails?.country || 'N/A'}</span>
                      </div>
                      {studentDetails?.whatsapp && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MessageSquare size={14} className="text-emerald-500" />
                          <span>{studentDetails.whatsapp}</span>
                        </div>
                      )}
                      {studentDetails?.educationlevel && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap size={14} className="text-gray-400" />
                          <span>{studentDetails.educationlevel}</span>
                        </div>
                      )}
                      {studentDetails?.passportnumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText size={14} className="text-gray-400" />
                          <span>Passport: {studentDetails.passportnumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={onViewStudent} className="p-2 text-[#4338CA] hover:bg-indigo-50 rounded-xl transition-colors">
                    <ExternalLink size={18} />
                  </button>
                </div>
              </section>

              {/* Program Info */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Institution and Program</h3>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 overflow-hidden">
                      {application.programs?.institutions?.logo_url ? (
                        <img 
                          src={application.programs.institutions.logo_url} 
                          alt={application.institution} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Building2 size={24} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{application.institution}</p>
                      <p className="text-xs text-gray-500">
                        {[application.programs?.institutions?.city, application.programs?.institutions?.country].filter(Boolean).join(', ') || 'Location N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="h-[1px] bg-gray-50"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#4338CA] flex items-center justify-center border border-indigo-100">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{application.program}</p>
                      <p className="text-xs text-gray-500">
                        {[
                          application.programs?.duration && `${application.programs.duration}`,
                          application.programs?.level && `${application.programs.level}`,
                          application.programs?.tuition_fee && `${application.programs.tuition_fee} ${application.programs.currency || 'USD'}`
                        ].filter(Boolean).join(' • ') || 'Program details N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recruiter Info */}
              {(user.role === 'admin' || user.role === 'institution') && application.recruiter_id && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recruiter Information</h3>
                    <button 
                      onClick={() => setIsRecruiterModalOpen(true)}
                      className="text-xs font-bold text-[#4338CA] hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      View Full Profile <ExternalLink size={12} />
                    </button>
                  </div>
                  
                  {application.recruiter ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#4338CA] flex items-center justify-center text-lg font-bold border border-indigo-100">
                        {application.recruiter.name?.split(' ').map((n: any) => n[0]).join('') || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-gray-900">{application.recruiter.name || 'Unknown Recruiter'}</h4>
                          {application.recruiter.is_verified && (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{application.recruiter.agency || 'Independent Recruiter'}</p>
                        
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail size={12} className="text-gray-400" />
                            <span className="truncate">{application.recruiter.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Globe size={12} className="text-gray-400" />
                            <span>{[application.recruiter.city, application.recruiter.country].filter(Boolean).join(', ') || '—'}</span>
                          </div>
                          {application.recruiter.whatsapp && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MessageSquare size={12} className="text-emerald-500" />
                              <span>{application.recruiter.whatsapp}</span>
                            </div>
                          )}
                          {application.recruiter.phone && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Globe size={12} className="text-gray-400" />
                              <span>{application.recruiter.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Recruiter Profile</p>
                          <p className="text-xs text-gray-500">Click to view details and metrics</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsRecruiterModalOpen(true)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Documents */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Required Documents</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${documents.length > 0 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                    {documents.length} Files Uploaded
                  </span>
                </div>
                
                {isLoadingDocs ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
                    <Clock size={14} />
                    <span>Loading documents...</span>
                  </div>
                ) : documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-indigo-100 hover:bg-white transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#4338CA] transition-colors">
                            <FileText size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{doc.type || 'Document'}</p>
                          </div>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-[#4338CA] transition-colors"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                    <FileText size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                  </div>
                )}
              </section>

              {/* Notes */}
              {application.notes && (
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Application Notes</h3>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5">
                    <p className="text-sm text-amber-900 leading-relaxed italic">
                      "{application.notes}"
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Timeline & Actions */}
            <div className="space-y-8">
              {/* Institution Actions */}
              {user.role === 'institution' && (
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Status Management</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] text-gray-500 font-medium mb-1">Update the current status of this application:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'In review', status: 'In review', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                        { label: 'Action Required', status: 'Action Required', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { label: 'Approve Application', status: 'Approved', color: 'text-green-600 bg-green-50 border-green-100' },
                        { label: 'Reject Application', status: 'Rejected', color: 'text-red-600 bg-red-50 border-red-100' },
                        { label: 'Ready for visa', status: 'Ready for visa', color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
                        { label: 'Refund', status: 'Refund', color: 'text-rose-600 bg-rose-50 border-rose-100' },
                      ].map((btn) => (
                        <button
                          key={btn.status}
                          disabled={isUpdating || application.status === btn.status}
                          onClick={() => handleStatusChange(btn.status)}
                          className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${
                            application.status === btn.status 
                              ? 'ring-2 ring-indigo-500 ring-offset-2' 
                              : 'hover:shadow-md'
                          } ${btn.color}`}
                        >
                          <span>{btn.label}</span>
                          {application.status === btn.status && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Actions */}
              {user.role !== 'admin' && (
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={handleChatAction}
                      disabled={isCheckingChat}
                      className="flex items-center justify-center gap-2 w-full bg-[#4338CA] text-white py-3.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors active:scale-95 disabled:opacity-50"
                    >
                      {isCheckingChat ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <MessageSquare size={18} />
                          <span>{user.role === 'institution' ? 'Chat with Partner' : 'Chat with Institution'}</span>
                        </>
                      )}
                    </button>
                    {user.role === 'partner' && (
                      <button className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors active:scale-95">
                        <FileText size={18} />
                        <span>Edit Application</span>
                      </button>
                    )}
                    {user.role === 'partner' && (
                      <button className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-red-600 py-3.5 rounded-xl font-medium text-sm hover:bg-red-50 hover:border-red-100 transition-colors active:scale-95">
                        <X size={18} />
                        <span>Cancel Application</span>
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Timeline */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Timeline</h3>
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                  {(() => {
                    const steps = [
                      { 
                        title: 'Application Submitted', 
                        date: application.created_at ? new Date(application.created_at).toLocaleDateString() : application.date,
                        status: 'completed' 
                      },
                      { 
                        title: 'Under Review', 
                        status: ['In review', 'Approved', 'Waiting payment', 'Payment received', 'Ready for visa', 'Done'].includes(application.status) ? 'completed' : 'current' 
                      },
                    ];

                    if (['Approved', 'Waiting payment', 'Payment received', 'Ready for visa', 'Done'].includes(application.status)) {
                      steps.push({ title: 'Approved', status: 'completed' });
                    } else if (application.status === 'Rejected') {
                      steps.push({ title: 'Rejected', status: 'current' });
                    }

                    if (application.visa_approved_at) {
                      steps.push({ 
                        title: 'Visa Approved', 
                        date: new Date(application.visa_approved_at).toLocaleDateString(),
                        status: 'completed' 
                      });
                    }

                    if (application.status === 'Done') {
                      steps.push({ title: 'Process Completed', status: 'completed' });
                    }

                    return steps.map((item, i) => (
                      <div key={i} className="flex gap-4 relative z-10">
                        <div className={`w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${
                          item.status === 'completed' ? 'bg-green-500' : 
                          item.status === 'current' ? 'bg-[#4338CA]' : 'bg-gray-200'
                        }`}>
                          {item.status === 'completed' && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${item.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                            {item.title}
                          </p>
                          {item.date && <p className="text-[10px] text-gray-500 font-medium">{item.date}</p>}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </section>

              {/* Payment Section */}
              {['Accepted', 'Approved', 'Waiting payment', 'Payment received', 'Ready for visa', 'Visa Approved', 'Done'].includes(application.status) && (
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment</h3>
                  
                  {/* If institution uses split payment and status is Visa Approved, show 2nd payment */}
                  {application.status === 'Visa Approved' ? (
                    (() => {
                      const inst = application.programs?.institutions;
                      const isSplit = inst?.payment_model === 'split_payment';
                      const isPlatform = inst?.payment_model === 'platform';
                      const deadlineDays = inst?.second_payment_deadline_days || 5;
                      const approvedDate = application.visa_approved_at ? new Date(application.visa_approved_at) : null;
                      const today = new Date();
                      const isOverdue = approvedDate ? (Math.ceil(Math.abs(today.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24)) > deadlineDays) : false;

                      if (isPlatform) {
                        return (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 text-indigo-700">
                            <Building2 size={20} />
                            <span className="text-sm font-bold">Payment Managed by Birley Platform</span>
                          </div>
                        );
                      }

                      if (!isSplit) {
                        return (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-emerald-700">
                            <CheckCircle2 size={20} />
                            <span className="text-sm font-bold">Payment Up to Date (100% Upfront)</span>
                          </div>
                        );
                      }

                      return (
                        <div className={`${isOverdue ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'} border rounded-2xl p-5 mb-4`}>
                          <div className="flex items-start gap-3 mb-4">
                            <AlertCircle size={20} className={`${isOverdue ? 'text-red-500' : 'text-amber-500'} shrink-0 mt-0.5`} />
                            <div>
                              <h4 className={`text-sm font-bold ${isOverdue ? 'text-red-900' : 'text-amber-900'}`}>
                                {isOverdue ? '2nd Payment OVERDUE' : '2nd Payment Required'}
                              </h4>
                              <p className={`text-xs ${isOverdue ? 'text-red-700' : 'text-amber-700'} mt-1`}>
                                Visa was approved on {approvedDate?.toLocaleDateString()}. 
                                {isOverdue ? ` Deadline was ${deadlineDays} days after approval.` : ` Please complete payment within ${deadlineDays} days.`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                // Simulate generating link
                                const link = `https://birley.platform/pay/${application.id}/part2`;
                                navigator.clipboard.writeText(link);
                                alert('Second payment link generated and copied to clipboard!');
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 ${isOverdue ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'} text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm`}
                            >
                              Generate 2nd Payment Link
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : application.status === 'Accepted' || application.status === 'Approved' || application.status === 'Waiting payment' ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <button className="flex-1 flex items-center justify-center gap-2 bg-[#4338CA] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                        Pay Initial Fee
                      </button>
                      <button 
                        onClick={handleCopyLink} 
                        title="Copy payment link"
                        className="p-2.5 text-gray-400 hover:text-[#4338CA] bg-gray-50 rounded-xl transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-emerald-700">
                      <CheckCircle2 size={20} />
                      <span className="text-sm font-bold">Payment Up to Date</span>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <AnimatePresence>
        {isMessageModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4338CA] flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Start Conversation</h3>
                    <p className="text-[10px] text-gray-500">Regarding {application.student}'s application</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMessageModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Message</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message to the institution here..."
                    className="w-full h-40 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsMessageModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#4338CA] text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Required Modal */}
      <AnimatePresence>
        {isActionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/30">
                <div className="flex items-center gap-3 text-amber-600">
                  <AlertCircle size={20} />
                  <h3 className="font-bold">Additional Documents Required</h3>
                </div>
                <button 
                  onClick={() => setIsActionModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Please specify what additional documents or information are required from the student. This message will be sent to the recruiter.
                </p>
                <textarea
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder="e.g., Please provide a translated copy of the high school diploma..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm"
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsActionModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitActionRequired}
                    disabled={isUpdating || !actionMessage.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isUpdating ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Send & Update Status</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recruiter Profile Modal */}
      {isRecruiterModalOpen && application.recruiter_id && (
        <RecruiterProfileModal 
          recruiterId={application.recruiter_id} 
          onClose={() => setIsRecruiterModalOpen(false)} 
        />
      )}
    </motion.div>
  );
};

export default ApplicationCard;
