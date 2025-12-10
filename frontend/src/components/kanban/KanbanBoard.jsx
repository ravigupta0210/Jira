import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { HiPlus, HiDotsVertical } from 'react-icons/hi';
import { clsx } from 'clsx';
import { ticketsAPI } from '../../services/api';
import { useProject } from '../../context/ProjectContext';
import { Avatar, PriorityBadge, TypeBadge } from '../common';
import toast from 'react-hot-toast';

const TicketCard = ({ ticket, index, onClick }) => {
  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(ticket)}
          className={clsx(
            'bg-white rounded-lg p-4 border border-gray-200 cursor-pointer transition-all',
            snapshot.isDragging
              ? 'shadow-lg ring-2 ring-primary-500'
              : 'hover:shadow-md hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500">{ticket.key}</span>
            <TypeBadge type={ticket.type} />
          </div>

          <h4 className="font-medium text-gray-900 mb-3 line-clamp-2">
            {ticket.title}
          </h4>

          <div className="flex items-center justify-between">
            <PriorityBadge priority={ticket.priority} />
            {ticket.assignee_first_name && (
              <Avatar
                user={{
                  first_name: ticket.assignee_first_name,
                  last_name: ticket.assignee_last_name,
                  avatar: ticket.assignee_avatar,
                }}
                size="xs"
              />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const KanbanColumn = ({ column, tickets, onTicketClick, onAddTicket }) => {
  return (
    <div className="flex flex-col bg-gray-100 rounded-xl min-w-[300px] max-w-[300px]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-gray-900">{column.name}</h3>
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
        <button
          onClick={() => onAddTicket(column.status_key)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
        >
          <HiPlus className="h-5 w-5" />
        </button>
      </div>

      {/* Tickets */}
      <Droppable droppableId={column.status_key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={clsx(
              'flex-1 px-3 pb-3 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)]',
              snapshot.isDraggingOver && 'bg-gray-200/50'
            )}
          >
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                onClick={onTicketClick}
              />
            ))}
            {provided.placeholder}

            {tickets.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No tickets
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export const KanbanBoard = ({ projectId, onTicketClick, onAddTicket }) => {
  const { kanbanBoard, fetchKanbanBoard, moveTicket } = useProject();
  const [board, setBoard] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchKanbanBoard(projectId);
    }
  }, [projectId, fetchKanbanBoard]);

  useEffect(() => {
    setBoard(kanbanBoard);
  }, [kanbanBoard]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Optimistically update the UI
    const newBoard = [...board];
    const sourceColumn = newBoard.find((col) => col.status_key === source.droppableId);
    const destColumn = newBoard.find((col) => col.status_key === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const [movedTicket] = sourceColumn.tickets.splice(source.index, 1);
    movedTicket.status = destination.droppableId;
    destColumn.tickets.splice(destination.index, 0, movedTicket);

    setBoard(newBoard);

    // Update on server
    const result2 = await moveTicket(draggableId, destination.droppableId);
    if (!result2.success) {
      // Revert on failure
      fetchKanbanBoard(projectId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tickets={column.tickets || []}
            onTicketClick={onTicketClick}
            onAddTicket={onAddTicket}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
