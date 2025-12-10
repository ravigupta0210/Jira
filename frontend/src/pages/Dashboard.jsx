import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiCollection,
  HiClipboardCheck,
  HiClock,
  HiTrendingUp,
  HiPlus,
  HiArrowRight,
} from 'react-icons/hi';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Spinner,
  Avatar,
  Badge,
  PriorityBadge,
  StatusBadge,
  EmptyState,
} from '../components/common';
import { formatRelativeTime, getMeetingTimeLabel, formatTime } from '../utils/helpers';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {trend && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
            <HiTrendingUp className="h-4 w-4" />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.get();
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = data?.ticketStats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <HiPlus className="h-5 w-5" />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={data?.projects?.length || 0}
          icon={HiCollection}
          color="bg-primary-600"
        />
        <StatCard
          title="My Open Tasks"
          value={stats.my_open_tickets || 0}
          icon={HiClipboardCheck}
          color="bg-amber-500"
        />
        <StatCard
          title="Completed This Week"
          value={stats.completed_this_week || 0}
          icon={HiTrendingUp}
          color="bg-green-500"
          trend="+12% from last week"
        />
        <StatCard
          title="Upcoming Meetings"
          value={data?.upcomingMeetings?.length || 0}
          icon={HiClock}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h2>
            <Link
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {data?.assignedTickets?.length > 0 ? (
              data.assignedTickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {ticket.key}
                        </span>
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {ticket.project_name}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={HiClipboardCheck}
                title="No tasks assigned"
                description="You don't have any tasks assigned to you yet."
              />
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Meetings</h2>
            <Link
              to="/meetings"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {data?.upcomingMeetings?.length > 0 ? (
              data.upcomingMeetings.slice(0, 4).map((meeting) => (
                <div
                  key={meeting.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors"
                  onClick={() => navigate(`/meetings/${meeting.id}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {getMeetingTimeLabel(meeting.start_time)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{meeting.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                icon={HiClock}
                title="No upcoming meetings"
                description="Schedule a meeting to see it here."
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-dark-700">
          {data?.recentActivity?.length > 0 ? (
            data.recentActivity.slice(0, 8).map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-start gap-4">
                <Avatar
                  user={{
                    first_name: activity.first_name,
                    last_name: activity.last_name,
                  }}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">
                      {activity.first_name} {activity.last_name}
                    </span>{' '}
                    {activity.action}{' '}
                    {activity.ticket_title && (
                      <span className="font-medium">
                        {activity.project_key}-{activity.ticket_number}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No recent activity"
              description="Activity from your projects will appear here."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
