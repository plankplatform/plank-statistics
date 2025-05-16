import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

interface ChartCardHeaderProps {
  title: string;
  onConfirmDelete: () => void;
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
}

const ChartCardHeader = ({
  title,
  onConfirmDelete,
  showDialog,
  setShowDialog,
}: ChartCardHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
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
  );
};

export default ChartCardHeader;
