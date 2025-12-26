
import React from 'react';

export const ArogyaLogo: React.FC<{ className?: string; color?: string }> = ({ className = "w-16 h-16", color = "currentColor" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Digital Circuit Background (AI) */}
    <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="1" strokeDasharray="2 4" opacity="0.2" />
    <path d="M50 5V15M50 85V95M5 50H15M85 50H95" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    
    {/* Stethoscope forming a shield shape */}
    <path d="M30 40C30 30 40 25 50 25C60 25 70 30 70 40V55C70 65 60 75 50 75C40 75 30 65 30 55V40Z" stroke={color} strokeWidth="4" />
    <path d="M50 75V85" stroke={color} strokeWidth="4" />
    <circle cx="50" cy="88" r="4" fill={color} />

    {/* Growing Plant (Rural/Nature) */}
    <path d="M50 65C50 65 45 55 40 50M50 65C50 65 55 55 60 50" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M40 50Q35 45 40 40Q45 45 40 50Z" fill={color} opacity="0.8" />
    <path d="M60 50Q65 45 60 40Q55 45 60 50Z" fill={color} opacity="0.8" />
    
    {/* Heartbeat Pulse Line (Life) */}
    <path d="M35 55H42L45 45L55 65L58 55H65" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
