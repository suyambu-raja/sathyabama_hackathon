/**
 * Input component with validation and error states
 */
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isInvalid?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type,
    label,
    error,
    helpText,
    leftIcon,
    rightIcon,
    isInvalid,
    id,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = isInvalid || !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-gray-400',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              hasError && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helpText) && (
          <div className="mt-1 text-sm">
            {error && (
              <p className="text-red-600">{error}</p>
            )}
            {!error && helpText && (
              <p className="text-gray-500">{helpText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };