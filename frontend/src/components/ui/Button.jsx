import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-95 transform
  `;

  const variants = {
    primary: `
      bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md
      focus:ring-blue-500 border border-transparent
    `,
    secondary: `
      bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md
      focus:ring-gray-500 border border-gray-300
    `,
    success: `
      bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md
      focus:ring-green-500 border border-transparent
    `,
    warning: `
      bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 hover:shadow-md
      focus:ring-yellow-500 border border-transparent
    `,
    danger: `
      bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md
      focus:ring-red-500 border border-transparent
    `,
    ghost: `
      bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500 border border-transparent
    `,
    outline: `
      bg-transparent text-blue-600 hover:bg-blue-50 hover:text-blue-700
      focus:ring-blue-500 border border-blue-300
    `,
    link: `
      bg-transparent text-blue-600 hover:text-blue-700 hover:underline
      focus:ring-blue-500 border border-transparent shadow-none p-0 h-auto
    `
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs h-7',
    sm: 'px-3 py-2 text-sm h-8',
    md: 'px-4 py-2.5 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!loading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;