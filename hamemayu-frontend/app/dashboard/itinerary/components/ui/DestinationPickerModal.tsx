import { ReactNode, MouseEvent } from 'react';
import GlassCard from './GlassCard';

interface PickerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function DestinationPickerModal({ isOpen, onClose, children }: PickerProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <GlassCard className="max-w-2xl w-full max-h-[85vh] flex flex-col p-6" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">Pilih Destinasi</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">{children}</div>
      </GlassCard>
    </div>
  );
}