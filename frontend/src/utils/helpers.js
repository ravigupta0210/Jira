import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, formatStr);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, 'MMM d, yyyy h:mm a');
};

export const formatTime = (date) => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, 'h:mm a');
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsed, { addSuffix: true });
};

export const getMeetingTimeLabel = (date) => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(parsed)) return `Today at ${formatTime(parsed)}`;
  if (isTomorrow(parsed)) return `Tomorrow at ${formatTime(parsed)}`;
  if (isThisWeek(parsed)) return format(parsed, "EEEE 'at' h:mm a");
  return formatDateTime(parsed);
};

export const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
};

export const getFullName = (user) => {
  if (!user) return '';
  return `${user.first_name || ''} ${user.last_name || ''}`.trim();
};

export const getPriorityColor = (priority) => {
  const colors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };
  return colors[priority] || colors.medium;
};

export const getStatusColor = (status) => {
  const colors = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
  };
  return colors[status] || colors.todo;
};

export const getTypeIcon = (type) => {
  const icons = {
    task: { icon: '✓', color: 'text-blue-500 bg-blue-100' },
    bug: { icon: '🐛', color: 'text-red-500 bg-red-100' },
    story: { icon: '📖', color: 'text-green-500 bg-green-100' },
    epic: { icon: '⚡', color: 'text-purple-500 bg-purple-100' },
  };
  return icons[type] || icons.task;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const generateColor = (str) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
