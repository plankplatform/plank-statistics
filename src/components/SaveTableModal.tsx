import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface SaveTableModalProps {
  onClose: () => void;
  onSave: (title: string) => void;
}

const SaveTableModal = ({ onClose, onSave }: SaveTableModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    inputRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleSubmit();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      alert(t('table.invalid_name'));
      return;
    }

    onSave(trimmed);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('table.save')}</DialogTitle>
        </DialogHeader>
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('table.name_placeholder')}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            {t('button.cancel')}
          </Button>
          <Button
            className="bg-plank-pink text-white hover:bg-plank-pink/90"
            onClick={handleSubmit}
          >
            {t('button.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTableModal;
