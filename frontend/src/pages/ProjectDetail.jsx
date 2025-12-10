import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiCog,
  HiViewBoards,
  HiViewList,
  HiUserAdd,
  HiChartBar,
} from 'react-icons/hi';
import { useProject } from '../context/ProjectContext';
import { authAPI, ticketsAPI } from '../services/api';
import {
  Button,
  Modal,
  Input,
  Spinner,
  Avatar,
  AvatarGroup,
  Badge,
  EmptyState,
  PriorityBadge,
  StatusBadge,
  TypeBadge,
} from '../components/common';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const TicketForm = ({ projectId, initialStatus, onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    status: initialStatus || 'todo',
    assigneeId: '',
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getUsers();
        setUsers(response.data.data.users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    onSubmit({ ...formData, projectId });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="What needs to be done?"
        autoFocus
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Add more details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="task">Task</option>
            <option value="bug">Bug</option>
            <option value="story">Story</option>
            <option value="epic">Epic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Assignee
        </label>
        <select
          name="assigneeId"
          value={formData.assigneeId}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Create Ticket
        </Button>
      </div>
    </form>
  );
};

const TicketDetail = ({ ticket, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await ticketsAPI.addComment(ticket.id, { content: comment });
      setComment('');
      onUpdate();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">{ticket.key}</span>
            <TypeBadge type={ticket.type} />
            <StatusBadge status={ticket.status} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{ticket.title}</h2>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
          <p className="text-gray-900">
            {ticket.description || 'No description provided'}
          </p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Assignee</h3>
            {ticket.assignee_first_name ? (
              <div className="flex items-center gap-2">
                <Avatar
                  user={{
                    first_name: ticket.assignee_first_name,
                    last_name: ticket.assignee_last_name,
                  }}
                  size="sm"
                />
                <span className="text-gray-900">
                  {ticket.assignee_first_name} {ticket.assignee_last_name}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Reporter</h3>
            <div className="flex items-center gap-2">
              <Avatar
                user={{
                  first_name: ticket.reporter_first_name,
                  last_name: ticket.reporter_last_name,
                }}
                size="sm"
              />
              <span className="text-gray-900">
                {ticket.reporter_first_name} {ticket.reporter_last_name}
              </span>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Comments</h3>

          <form onSubmit={handleAddComment} className="mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
            />
            <Button type="submit" size="sm" loading={submitting} disabled={!comment.trim()}>
              Add Comment
            </Button>
          </form>

          <div className="space-y-4">
            {ticket.comments?.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar
                  user={{
                    first_name: c.first_name,
                    last_name: c.last_name,
                  }}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProject, createTicket, loading } = useProject();
  const [viewMode, setViewMode] = useState('kanban');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [initialStatus, setInitialStatus] = useState('todo');
  const [submitting, setSubmitting] = useState(false);
  const [ticketDetail, setTicketDetail] = useState(null);

  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id, fetchProject]);

  const handleCreateTicket = async (data) => {
    setSubmitting(true);
    const result = await createTicket(data);
    setSubmitting(false);

    if (result.success) {
      setShowTicketModal(false);
      fetchProject(id);
    }
  };

  const handleTicketClick = async (ticket) => {
    try {
      const response = await ticketsAPI.getOne(ticket.id);
      setTicketDetail(response.data.data.ticket);
      setSelectedTicket(ticket);
    } catch (error) {
      toast.error('Failed to load ticket details');
    }
  };

  const handleAddTicket = (status) => {
    setInitialStatus(status);
    setShowTicketModal(true);
  };

  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <EmptyState
        title="Project not found"
        description="The project you're looking for doesn't exist or you don't have access."
        action={() => navigate('/projects')}
        actionLabel="Go to Projects"
      />
    );
  }

  const stats = currentProject.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: currentProject.color || '#6366f1' }}
          >
            {currentProject.key?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
            <p className="text-gray-500">{currentProject.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AvatarGroup
            users={currentProject.members || []}
            max={4}
          />
          <Button variant="secondary" icon={HiUserAdd}>
            Invite
          </Button>
          <Button icon={HiPlus} onClick={() => setShowTicketModal(true)}>
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Tickets</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">To Do</p>
          <p className="text-2xl font-bold text-gray-900">{stats.todo || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.in_progress || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Done</p>
          <p className="text-2xl font-bold text-green-600">{stats.done || 0}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            <HiViewBoards className="h-5 w-5" />
            Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            <HiViewList className="h-5 w-5" />
            List
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          projectId={id}
          onTicketClick={handleTicketClick}
          onAddTicket={handleAddTicket}
        />
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Create Ticket"
      >
        <TicketForm
          projectId={id}
          initialStatus={initialStatus}
          onSubmit={handleCreateTicket}
          onClose={() => setShowTicketModal(false)}
          loading={submitting}
        />
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => {
          setSelectedTicket(null);
          setTicketDetail(null);
        }}
        title="Ticket Details"
        size="lg"
      >
        {ticketDetail && (
          <TicketDetail
            ticket={ticketDetail}
            onClose={() => {
              setSelectedTicket(null);
              setTicketDetail(null);
            }}
            onUpdate={() => {
              if (selectedTicket) {
                handleTicketClick(selectedTicket);
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProjectDetail;
