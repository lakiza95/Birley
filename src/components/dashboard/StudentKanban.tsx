import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { StudentStatus } from '../../types';
import { Lock, Mail, MapPin, Calendar, MoreVertical } from 'lucide-react';

interface StudentKanbanProps {
  students: any[];
  onStatusChange: (studentId: string, newStatus: StudentStatus) => void;
  onStudentClick: (studentId: string) => void;
}

const COLUMNS: { id: StudentStatus; title: string; color: string; isAutomated: boolean }[] = [
  { id: 'New Student', title: 'New Student', color: 'bg-gray-50 text-gray-600', isAutomated: false },
  { id: 'Follow up', title: 'Follow up', color: 'bg-blue-50 text-blue-600', isAutomated: false },
  { id: 'Ready to apply', title: 'Ready to apply', color: 'bg-indigo-50 text-indigo-600', isAutomated: false },
  { id: 'Application started', title: 'Application started', color: 'bg-purple-50 text-purple-600', isAutomated: true },
  { id: 'Action Required', title: 'Action Required', color: 'bg-amber-50 text-amber-600', isAutomated: true },
  { id: 'Application accepted', title: 'Application accepted', color: 'bg-emerald-50 text-emerald-600', isAutomated: true },
  { id: 'Waiting payment', title: 'Waiting payment', color: 'bg-orange-50 text-orange-600', isAutomated: true },
  { id: 'Payment received', title: 'Payment received', color: 'bg-teal-50 text-teal-600', isAutomated: true },
  { id: 'Ready for visa', title: 'Ready for visa', color: 'bg-cyan-50 text-cyan-600', isAutomated: true },
  { id: 'Waiting visa', title: 'Waiting visa', color: 'bg-blue-50 text-blue-600', isAutomated: false },
  { id: 'Done', title: 'Done', color: 'bg-green-100 text-green-700', isAutomated: false },
  { id: 'Refund', title: 'Refund', color: 'bg-red-50 text-red-600', isAutomated: true }
];

const StudentKanban: React.FC<StudentKanbanProps> = ({ students, onStatusChange, onStudentClick }) => {
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

    const newStatus = destination.droppableId as StudentStatus;
    onStatusChange(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
        {COLUMNS.map(column => {
          const columnStudents = students.filter(s => s.status === column.id);

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
                <span className="text-sm font-bold text-gray-400">{columnStudents.length}</span>
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
                    {columnStudents.map((student, index) => (
                      <Draggable key={student.id} draggableId={student.id} index={index} isDragDisabled={column.isAutomated}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onStudentClick(student.id)}
                            className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all group ${
                              column.isAutomated ? 'cursor-pointer opacity-90' : 'cursor-grab hover:shadow-md'
                            } ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-brand/20 rotate-2 cursor-grabbing' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center font-bold text-sm">
                                  {student.name?.[0]}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{student.name}</h4>
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin size={10} />
                                    <span className="truncate max-w-[100px]">{student.country}</span>
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
                                <Mail size={12} className="text-gray-400" />
                                <span className="truncate">{student.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar size={12} className="text-gray-400" />
                                <span>{new Date(student.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
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

export default StudentKanban;
