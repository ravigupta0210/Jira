import { clsx } from 'clsx';

const variants = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'primary' && 'bg-primary-500',
            variant === 'gray' && 'bg-gray-500'
          )}
        />
      )}
      {children}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const config = {
    critical: { label: 'Critical', variant: 'danger' },
    high: { label: 'High', variant: 'warning' },
    medium: { label: 'Medium', variant: 'primary' },
    low: { label: 'Low', variant: 'success' },
  };

  const { label, variant } = config[priority] || config.medium;

  return <Badge variant={variant}>{label}</Badge>;
};

export const StatusBadge = ({ status }) => {
  const config = {
    todo: { label: 'To Do', variant: 'gray' },
    in_progress: { label: 'In Progress', variant: 'blue' },
    in_review: { label: 'In Review', variant: 'warning' },
    done: { label: 'Done', variant: 'success' },
  };

  const { label, variant } = config[status] || config.todo;

  return <Badge variant={variant} dot>{label}</Badge>;
};

export const TypeBadge = ({ type }) => {
  const config = {
    task: { label: 'Task', icon: '✓', variant: 'blue' },
    bug: { label: 'Bug', icon: '🐛', variant: 'danger' },
    story: { label: 'Story', icon: '📖', variant: 'success' },
    epic: { label: 'Epic', icon: '⚡', variant: 'purple' },
  };

  const { label, icon, variant } = config[type] || config.task;

  return (
    <Badge variant={variant}>
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
};

export default Badge;
