import { ReactNode, MouseEvent } from 'react';
import GlassCard from './GlassCard';

interface SlotProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SlotManagerModal({ isOpen, onClose, title, children }: SlotProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <GlassCard className="max-w-md w-full p-6 border-green-200 dark:border-slate-700" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4 font-serif text-slate-900 dark:text-white">{title}</h3>
        {children}
      </GlassCard>
    </div>
  );
}