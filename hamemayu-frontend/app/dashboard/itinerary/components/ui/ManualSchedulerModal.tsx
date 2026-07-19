import { ReactNode, MouseEvent } from 'react';
import GlassCard from './GlassCard';

interface SchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function ManualSchedulerModal({ isOpen, onClose, children }: SchedulerProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e: MouseEvent) => e.stopPropagation()}>
        {children}
      </GlassCard>
    </div>
  );
}