import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, Download, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error' | 'download';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
  onCloseToast?: (id: string) => void;
}

const ToastItem: React.FC<{
  toast: ToastMessage;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const type = toast.type || 'success';

  let bgStyle = 'bg-slate-900/95 border-emerald-500/80 text-emerald-300 shadow-emerald-950/40';
  let IconComponent = CheckCircle2;

  if (type === 'download') {
    bgStyle = 'bg-slate-900/95 border-sky-500/80 text-sky-300 shadow-sky-950/40';
    IconComponent = Download;
  } else if (type === 'warning') {
    bgStyle = 'bg-slate-900/95 border-amber-500/80 text-amber-300 shadow-amber-950/40';
    IconComponent = AlertCircle;
  } else if (type === 'error') {
    bgStyle = 'bg-slate-900/95 border-rose-500/80 text-rose-300 shadow-rose-950/40';
    IconComponent = AlertCircle;
  } else if (type === 'info') {
    bgStyle = 'bg-slate-900/95 border-sky-500/80 text-sky-300 shadow-sky-950/40';
    IconComponent = Info;
  }

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-4 p-3.5 px-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${bgStyle}`}
    >
      <div className="flex items-center gap-3">
        <IconComponent className={`w-5 h-5 shrink-0 ${type === 'download' ? 'animate-bounce' : ''}`} />
        <span className="text-xs font-bold text-slate-100">{toast.message}</span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose(toast.id);
        }}
        className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
        title="إغلاق التنبيه"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss, onCloseToast }) => {
  const handleClose = (id: string) => {
    if (onDismiss) onDismiss(id);
    if (onCloseToast) onCloseToast(id);
  };

  if (!toasts || toasts.length === 0) return null;

  const visibleToasts = toasts.slice(-3);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 max-w-lg w-full px-4 pointer-events-none dir-rtl" dir="rtl">
      {visibleToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
};
