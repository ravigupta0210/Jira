import { clsx } from 'clsx';
import { getInitials, generateColor } from '../../utils/helpers';

const sizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

export const Avatar = ({
  user,
  size = 'md',
  className = '',
  showStatus = false,
  status = 'offline',
}) => {
  const initials = getInitials(user?.first_name, user?.last_name);
  const bgColor = generateColor(user?.email || user?.id || 'default');

  return (
    <div className={clsx('relative inline-flex', className)}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={`${user.first_name} ${user.last_name}`}
          className={clsx(
            'rounded-full object-cover',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-medium text-white',
            sizes[size]
          )}
          style={{ backgroundColor: bgColor }}
        >
          {initials || '?'}
        </div>
      )}
      {showStatus && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
            status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 4, size = 'sm' }) => {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user, index) => (
        <Avatar
          key={user.id || index}
          user={user}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 ring-2 ring-white',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default Avatar;
