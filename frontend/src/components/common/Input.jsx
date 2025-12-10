import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { HiExclamationCircle } from 'react-icons/hi';

export const Input = forwardRef(({
  label,
  error,
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={clsx("h-5 w-5", error ? "text-red-400" : "text-gray-400")} />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'dark:bg-dark-700 dark:text-white dark:placeholder-gray-400',
            Icon && 'pl-10',
            error && 'pr-10',
            error
              ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:ring-red-500'
              : 'border-gray-300 dark:border-dark-600 focus:ring-primary-500',
            className
          )}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <HiExclamationCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <div className="mt-1.5 flex items-center gap-1">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
