import React from 'react';

const Badge = React.forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center font-medium rounded-full
    transition-colors duration-200
  `;

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    // Solid variants
    'solid-default': 'bg-gray-600 text-white',
    'solid-primary': 'bg-blue-600 text-white',
    'solid-success': 'bg-green-600 text-white',
    'solid-warning': 'bg-yellow-600 text-white',
    'solid-danger': 'bg-red-600 text-white',
    'solid-info': 'bg-cyan-600 text-white',
    // Outline variants
    'outline-default': 'border border-gray-300 text-gray-700 bg-transparent',
    'outline-primary': 'border border-blue-300 text-blue-700 bg-transparent',
    'outline-success': 'border border-green-300 text-green-700 bg-transparent',
    'outline-warning': 'border border-yellow-300 text-yellow-700 bg-transparent',
    'outline-danger': 'border border-red-300 text-red-700 bg-transparent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <span ref={ref} className={classes} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;