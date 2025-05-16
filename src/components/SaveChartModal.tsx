import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SaveChartModalProps {
  onClose: () => void;
  onSave: (title: string) => void;
}

const SaveChartModal = ({ onClose, onSave }: SaveChartModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');

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
      alert('Inserisci un nome valido per il grafico.');
      return;
    }

    onSave(trimmed);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Salva grafico</DialogTitle>
        </DialogHeader>
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome del grafico"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button
            className="bg-plank-pink text-white hover:bg-plank-pink/90"
            onClick={handleSubmit}
          >
            Salva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveChartModal;
