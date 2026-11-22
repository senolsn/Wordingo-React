import React from 'react';
import usFlag from '../assets/us.svg';
import trFlag from '../assets/tr.svg';

interface LanguageBadgeProps {
  fromLang?: 'en' | 'tr';
  toLang?: 'en' | 'tr';
  variant?: 'default' | 'inverted';
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  fromLang = 'en',
  toLang = 'tr',
  variant = 'default'
}) => {
  const fromImg = fromLang === 'en' ? usFlag : trFlag;
  const toImg = toLang === 'tr' ? trFlag : usFlag;
  const fromLabel = fromLang === 'en' ? 'English' : 'Türkçe';
  const toLabel = toLang === 'tr' ? 'Türkçe' : 'English';

  if (variant === 'inverted') {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-white/90 font-medium">
        <img
          src={fromImg}
          alt={fromLabel}
          className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-white/30 shrink-0"
        />
        <span>{fromLabel}</span>
        <span className="text-white/80 font-bold" aria-hidden="true">➔</span>
        <img
          src={toImg}
          alt={toLabel}
          className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-white/30 shrink-0"
        />
        <span>{toLabel}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
      <img
        src={fromImg}
        alt={fromLabel}
        className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-black/10 shrink-0"
      />
      <span>{fromLabel}</span>
      <span className="text-slate-400 dark:text-slate-500 font-bold" aria-hidden="true">➔</span>
      <img
        src={toImg}
        alt={toLabel}
        className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-black/10 shrink-0"
      />
      <span>{toLabel}</span>
    </div>
  );
};
