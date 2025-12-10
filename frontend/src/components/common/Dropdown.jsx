import { useState } from 'react';
import { clsx } from 'clsx';
import { useClickOutside } from '../../hooks/useClickOutside';

export const Dropdown = ({
  trigger,
  children,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => setIsOpen(false));

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 mt-2 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-100 dark:border-dark-700 py-1 min-w-[180px] animate-fade-in',
            alignmentClasses[align],
            className
          )}
        >
          {typeof children === 'function'
            ? children({ close: () => setIsOpen(false) })
            : children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({
  children,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors',
        danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};

export const DropdownDivider = () => (
  <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
);

export default Dropdown;
