import React from 'react';

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showValue = true, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={['w-full', className].join(' ')}>
      {(label || showValue) && (
        <div className="mb-1 flex justify-between text-sm text-gray-600">
          {label && <span>{label}</span>}
          {showValue && <span>{clamped}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ width: `${clamped}%` }}
          className="h-full rounded-full bg-indigo-600 transition-all duration-300 ease-out"
        />
      </div>
    </div>
  );
}
