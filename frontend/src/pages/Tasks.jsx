import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiFilter,
  HiSearch,
  HiClipboardCheck,
} from 'react-icons/hi';
import { ticketsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Spinner,
  Avatar,
  EmptyState,
  PriorityBadge,
  StatusBadge,
  TypeBadge,
  Input,
  Badge,
} from '../components/common';
import { formatRelativeTime } from '../utils/helpers';
import { clsx } from 'clsx';

export const Tasks = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('assigned');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const params = {};

        if (filter === 'assigned') {
          params.assigneeId = user?.id;
        }
        if (statusFilter) {
          params.status = statusFilter;
        }
        if (search) {
          params.search = search;
        }

        const response = await ticketsAPI.getAll(params);
        setTickets(response.data.data.tickets);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [filter, statusFilter, search, user?.id]);

  const groupedTickets = tickets.reduce((acc, ticket) => {
    const status = ticket.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(ticket);
    return acc;
  }, {});

  const statusOrder = ['todo', 'in_progress', 'in_review', 'done'];
  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your assigned tasks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setFilter('assigned')}
            className={clsx(
              'px-4 py-2 rounded-lg transition-colors',
              filter === 'assigned' ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            Assigned to me
          </button>
          <button
            onClick={() => setFilter('all')}
            className={clsx(
              'px-4 py-2 rounded-lg transition-colors',
              filter === 'all' ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            All Tasks
          </button>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Tasks List */}
      {tickets.length > 0 ? (
        <div className="space-y-8">
          {statusOrder.map((status) => {
            const statusTickets = groupedTickets[status] || [];
            if (statusTickets.length === 0 && statusFilter) return null;

            return (
              <div key={status}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {statusLabels[status]}
                  </h2>
                  <Badge variant={status === 'done' ? 'success' : 'gray'}>
                    {statusTickets.length}
                  </Badge>
                </div>

                {statusTickets.length > 0 ? (
                  <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 divide-y divide-gray-100 dark:divide-dark-700">
                    {statusTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors"
                        onClick={() => navigate(`/projects/${ticket.project_id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {ticket.key}
                              </span>
                              <TypeBadge type={ticket.type} />
                              <PriorityBadge priority={ticket.priority} />
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                              {ticket.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {ticket.project_name} • Updated {formatRelativeTime(ticket.updated_at)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {ticket.assignee_first_name && (
                              <Avatar
                                user={{
                                  first_name: ticket.assignee_first_name,
                                  last_name: ticket.assignee_last_name,
                                }}
                                size="sm"
                              />
                            )}
                            <StatusBadge status={ticket.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
                    No tasks in {statusLabels[status].toLowerCase()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={HiClipboardCheck}
          title="No tasks found"
          description={
            filter === 'assigned'
              ? "You don't have any tasks assigned to you yet."
              : 'No tasks match your current filters.'
          }
        />
      )}
    </div>
  );
};

export default Tasks;
