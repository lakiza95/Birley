import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ApplicationStatus } from '../../types';
import { Lock, Building2, GraduationCap, Calendar, MoreVertical, AlertCircle } from 'lucide-react';

interface ApplicationKanbanProps {
  applications: any[];
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onApplicationClick: (applicationId: string) => void;
}

const COLUMNS: { id: ApplicationStatus; title: string; color: string; isAutomated: boolean }[] = [
  { id: 'New application', title: 'New application', color: 'bg-gray-100 text-gray-600', isAutomated: true },
  { id: 'In review', title: 'In review', color: 'bg-blue-50 text-blue-600', isAutomated: false },
  { id: 'Action Required', title: 'Action Required', color: 'bg-amber-50 text-amber-600', isAutomated: false },
  { id: 'Approved', title: 'Approved', color: 'bg-emerald-50 text-emerald-600', isAutomated: false },
  { id: 'Rejected', title: 'Rejected', color: 'bg-red-50 text-red-600', isAutomated: false },
  { id: 'Waiting payment', title: 'Waiting payment', color: 'bg-orange-50 text-orange-600', isAutomated: true },
  { id: 'Payment received', title: 'Payment received', color: 'bg-teal-50 text-teal-600', isAutomated: true },
  { id: 'Ready for visa', title: 'Ready for visa', color: 'bg-cyan-50 text-cyan-600', isAutomated: false },
  { id: 'Visa Approved', title: 'Visa Approved', color: 'bg-indigo-50 text-indigo-600', isAutomated: false },
  { id: 'Done', title: 'Done', color: 'bg-green-100 text-green-700', isAutomated: true },
  { id: 'Refund', title: 'Refund', color: 'bg-rose-50 text-rose-600', isAutomated: false }
];

const ApplicationKanban: React.FC<ApplicationKanbanProps> = ({ applications, onStatusChange, onApplicationClick }) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColumn = COLUMNS.find(c => c.id === source.droppableId);
    const destColumn = COLUMNS.find(c => c.id === destination.droppableId);

    if (sourceColumn?.isAutomated || destColumn?.isAutomated) {
      alert('This stage is automated and cannot be changed manually.');
      return;
    }

    const newStatus = destination.droppableId as ApplicationStatus;
    onStatusChange(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
        {COLUMNS.map(column => {
          const columnApps = applications.filter(a => a.status === column.id);

          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col bg-gray-50/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${column.color}`}>
                    {column.title}
                  </div>
                  {column.isAutomated && (
                    <Lock size={12} className="text-gray-400" />
                  )}
                </div>
                <span className="text-sm font-bold text-gray-400">{columnApps.length}</span>
              </div>

              <Droppable droppableId={column.id} isDropDisabled={column.isAutomated}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 flex flex-col gap-3 min-h-[150px] transition-colors rounded-xl ${
                      snapshot.isDraggingOver ? 'bg-gray-100/50' : ''
                    }`}
                  >
                    {columnApps.map((app, index) => {
                      const inst = app.programs?.institutions;
                      const isSplit = inst?.payment_model === 'split_payment';
                      const deadlineDays = inst?.second_payment_deadline_days || 5;
                      const approvedDate = app.visa_approved_at ? new Date(app.visa_approved_at) : null;
                      const today = new Date();
                      const isOverdue = app.status === 'Visa Approved' && isSplit && approvedDate ? (Math.ceil(Math.abs(today.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24)) > deadlineDays) : false;

                      return (
                        <Draggable key={app.db_id} draggableId={app.db_id} index={index} isDragDisabled={column.isAutomated}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onApplicationClick(app.db_id)}
                              className={`bg-white p-4 rounded-xl border transition-all group ${
                                isOverdue ? 'border-red-200 shadow-red-50' : 'border-gray-200 shadow-sm'
                              } ${
                                column.isAutomated ? 'cursor-pointer opacity-90' : 'cursor-grab hover:shadow-md'
                              } ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-brand/20 rotate-2 cursor-grabbing' : ''
                              } ${isOverdue ? 'ring-1 ring-red-500/20' : ''}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{app.studentName}</h4>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      App #{app.id}
                                      {isOverdue && (
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full animate-pulse">
                                          <AlertCircle size={10} />
                                          OVERDUE
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Building2 size={12} className="text-gray-400 shrink-0" />
                                  <span className="truncate">{app.school}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <GraduationCap size={12} className="text-gray-400 shrink-0" />
                                  <span className="truncate">{app.program}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Calendar size={12} className="text-gray-400 shrink-0" />
                                  <span>{new Date(app.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default ApplicationKanban;
