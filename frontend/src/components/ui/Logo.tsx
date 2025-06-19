import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-black rounded-full flex items-center justify-center ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 8V4H8 M 6.0 8.0 H 18.0 A 2.0 2.0 0 0 1 20.0 10.0 V 18.0 A 2.0 2.0 0 0 1 18.0 20.0 H 6.0 A 2.0 2.0 0 0 1 4.0 18.0 V 10.0 A 2.0 2.0 0 0 1 6.0 8.0 Z M2 14h2 M20 14h2 M15 13v2 M9 13v2" />
      </svg>
    </div>
  );
};

export default Logo;
