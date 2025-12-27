
import React from 'react';

export const ArogyaLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-16 h-16", color = "#00B4FF" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Central Hub */}
    <circle cx="50" cy="50" r="10" fill={color} />
    
    {/* Node 1 - Top Left */}
    <line x1="50" y1="50" x2="25" y2="25" stroke={color} strokeWidth="4" />
    <circle cx="25" cy="25" r="6" fill={color} />
    
    {/* Node 2 - Top Right */}
    <line x1="50" y1="50" x2="75" y2="30" stroke={color} strokeWidth="4" />
    <circle cx="75" cy="30" r="6" fill={color} />
    
    {/* Node 3 - Mid Right */}
    <line x1="50" y1="50" x2="85" y2="55" stroke={color} strokeWidth="4" />
    <circle cx="85" cy="55" r="6" fill={color} />
    
    {/* Node 4 - Bottom Right */}
    <line x1="50" y1="50" x2="65" y2="85" stroke={color} strokeWidth="4" />
    <circle cx="65" cy="85" r="6" fill={color} />
    
    {/* Node 5 - Bottom Left */}
    <line x1="50" y1="50" x2="30" y2="80" stroke={color} strokeWidth="4" />
    <circle cx="30" cy="80" r="6" fill={color} />
    
    {/* Node 6 - Mid Left */}
    <line x1="50" y1="50" x2="20" y2="55" stroke={color} strokeWidth="4" />
    <circle cx="20" cy="55" r="6" fill={color} />
  </svg>
);
