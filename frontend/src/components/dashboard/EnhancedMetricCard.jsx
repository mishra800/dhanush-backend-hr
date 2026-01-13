import React from 'react';
import { TrendingUp, TrendingDown, Minus, MoreVertical } from 'lucide-react';
import Badge from '../ui/Badge';

const EnhancedMetricCard = ({ 
  title, 
  value, 
  change,
  changeType = 'percentage', // 'percentage', 'absolute', 'none'
  subtitle, 
  trend, 
  trendValue,
  color = 'blue',
  icon,
  onClick,
  loading = false,
  actions = [],
  size = 'default', // 'compact', 'default', 'large'
  variant = 'default' // 'default', 'minimal', 'gradient'
}) => {
  const colorClasses = {
    blue: {
      border: 'border-blue-500',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600'
    },
    green: {
      border: 'border-green-500',
      text: 'text-green-600',
      bg: 'bg-green-50',
      gradient: 'from-green-500 to-green-600'
    },
    red: {
      border: 'border-red-500',
      text: 'text-red-600',
      bg: 'bg-red-50',
      gradient: 'from-red-500 to-red-600'
    },
    yellow: {
      border: 'border-yellow-500',
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    purple: {
      border: 'border-purple-500',
      text: 'text-purple-600',
      bg: 'bg-purple-50',
      gradient: 'from-purple-500 to-purple-600'
    },
    indigo: {
      border: 'border-indigo-500',
      text: 'text-indigo-600',
      bg: 'bg-indigo-50',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  };

  const getTrendFromChange = (changeValue) => {
    if (!changeValue) return null;
    if (changeValue > 0) return 'up';
    if (changeValue < 0) return 'down';
    return 'neutral';
  };

  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  const displayTrend = trend || getTrendFromChange(change);
  const displayTrendValue = trendValue || (change ? `${Math.abs(change)}${changeType === 'percentage' ? '%' : ''}` : null);

  const sizeClasses = {
    compact: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  const valueSize = {
    compact: 'text-2xl',
    default: 'text-3xl',
    large: 'text-4xl'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-white border border-gray-200 hover:border-gray-300';
      case 'gradient':
        return `bg-gradient-to-br ${colorClasses[color].gradient} text-white border-0`;
      default:
        return `bg-white border-l-4 ${colorClasses[color].border} shadow-sm hover:shadow-md`;
    }
  };

  const getTextColor = () => {
    if (variant === 'gradient') return 'text-white';
    return colorClasses[color].text;
  };

  const getIconBg = () => {
    if (variant === 'gradient') return 'bg-white bg-opacity-20';
    return colorClasses[color].bg;
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${getVariantClasses()}
        ${sizeClasses[size]}
        rounded-xl overflow-hidden transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-105 transform' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <dt className={`text-sm font-medium ${variant === 'gradient' ? 'text-white text-opacity-90' : 'text-gray-500'} truncate`}>
              {title}
            </dt>
            {actions.length > 0 && (
              <div className="relative">
                <button className={`p-1 rounded-md hover:bg-gray-100 ${variant === 'gradient' ? 'hover:bg-white hover:bg-opacity-20' : ''}`}>
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className={`h-8 ${variant === 'gradient' ? 'bg-white bg-opacity-20' : 'bg-gray-200'} rounded w-24 mb-2`}></div>
              <div className={`h-4 ${variant === 'gradient' ? 'bg-white bg-opacity-20' : 'bg-gray-200'} rounded w-16`}></div>
            </div>
          ) : (
            <>
              <dd className={`${valueSize[size]} font-bold ${getTextColor()} mb-1`}>
                {value}
              </dd>
              
              {subtitle && (
                <p className={`text-xs ${variant === 'gradient' ? 'text-white text-opacity-75' : 'text-gray-400'} mb-2`}>
                  {subtitle}
                </p>
              )}
              
              {displayTrend && displayTrendValue && (
                <div className="flex items-center space-x-2">
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${variant === 'gradient' ? 'bg-white bg-opacity-20 text-white' : trendColors[displayTrend]}
                  `}>
                    {displayTrend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {displayTrend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {displayTrend === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
                    <span>{displayTrendValue}</span>
                  </span>
                  <span className={`text-xs ${variant === 'gradient' ? 'text-white text-opacity-75' : 'text-gray-500'}`}>
                    vs last period
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {icon && (
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center ml-4
            ${getIconBg()}
          `}>
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMetricCard;