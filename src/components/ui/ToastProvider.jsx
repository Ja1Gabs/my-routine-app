import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-50',
    iconClassName: 'text-emerald-300',
  },
  error: {
    icon: AlertCircle,
    className: 'border-rose-500/25 bg-rose-500/10 text-rose-50',
    iconClassName: 'text-rose-300',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-50',
    iconClassName: 'text-amber-300',
  },
  info: {
    icon: Info,
    className: 'border-sky-500/25 bg-sky-500/10 text-sky-50',
    iconClassName: 'text-sky-300',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = crypto.randomUUID();
    const nextToast = {
      id,
      tone: 'info',
      duration: 3400,
      ...toast,
    };

    setToasts((prev) => [...prev, nextToast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, nextToast.duration);
  }, []);

  const value = useMemo(() => ({
    pushToast,
    success: (title, description) => pushToast({ tone: 'success', title, description }),
    error: (title, description) => pushToast({ tone: 'error', title, description }),
    warning: (title, description) => pushToast({ tone: 'warning', title, description }),
    info: (title, description) => pushToast({ tone: 'info', title, description }),
    removeToast,
  }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[120] w-[min(92vw,380px)] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const tone = TOAST_STYLES[toast.tone] || TOAST_STYLES.info;
            const Icon = tone.icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className={`pointer-events-auto rounded-2xl border backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.24)] ${tone.className}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 ${tone.iconClassName}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight">{toast.title}</p>
                    {toast.description && <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.description}</p>}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="shrink-0 rounded-lg p-1 hover:bg-white/10 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
