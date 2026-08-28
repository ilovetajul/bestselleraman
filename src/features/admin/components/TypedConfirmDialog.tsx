import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';

interface TypedConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  requiredText: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TypedConfirmDialog: React.FC<TypedConfirmDialogProps> = ({
  open,
  title,
  description,
  requiredText,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState('');
  const matches = value === requiredText;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          onClick={onCancel}
        >
          <motion.div
            className="bg-surface dark:bg-surface-dark rounded-2xl shadow-xl max-w-sm w-full p-6"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold mb-2 text-rose-600 dark:text-rose-300">{title}</h3>
            <p className="text-sm text-ink/65 dark:text-white/65 mb-4">{description}</p>
            <p className="text-xs text-ink/50 dark:text-white/50 mb-1.5">
              Type <span className="font-mono font-bold">{requiredText}</span> to confirm:
            </p>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-transparent outline-none focus:border-rose-500 mb-5 font-mono"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setValue(''); onCancel(); }}>
                Cancel
              </Button>
              <Button variant="danger" disabled={!matches} onClick={() => { onConfirm(); setValue(''); }}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
