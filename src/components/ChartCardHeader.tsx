import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Pencil, Save } from 'lucide-react';

interface ChartCardHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onConfirmDelete: () => void;
  onSave: () => void;
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
}

const ChartCardHeader = ({
  title,
  onTitleChange,
  onConfirmDelete,
  onSave,
  showDialog,
  setShowDialog,
}: ChartCardHeaderProps) => {
  const [editing, setEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <div onDoubleClick={() => setEditing(true)} className="flex-1">
        {editing ? (
          <input
            ref={inputRef}
            className="text-base font-semibold text-gray-800 bg-white border-b border-gray-300 focus:outline-none focus:border-plank-pink"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (localTitle !== title) onTitleChange(localTitle);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                inputRef.current?.blur();
              }
            }}
          />
        ) : (
          <h3 className="text-base font-semibold text-gray-800 truncate">{localTitle}</h3>
        )}
      </div>

      <div className="flex gap-1 items-center ml-2">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onSave}>
          <Save className="w-4 h-4" />
        </Button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-lg w-8 h-8">
              ×
            </Button>
          </DialogTrigger>
          <DialogContent>
            <div className="text-sm">Vuoi eliminare il grafico?</div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annulla
              </Button>
              <Button
                className="bg-plank-pink text-white hover:bg-plank-pink/90"
                onClick={onConfirmDelete}
              >
                Elimina
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ChartCardHeader;
