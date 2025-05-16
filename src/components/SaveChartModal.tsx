import { useEffect, useRef } from 'react';

interface SaveChartModalProps {
  onClose: () => void;
  onSave: (title: string) => void;
}

const SaveChartModal = ({ onClose, onSave }: SaveChartModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = () => {
    const value = inputRef.current?.value?.trim();
    if (!value) {
      alert('Inserisci un nome valido per il grafico.');
      return;
    }

    onSave(value);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <h2 className="text-lg mb-4">Salva grafico</h2>
        <input
          ref={inputRef}
          type="text"
          placeholder="Nome del grafico"
          className="text-sm w-full border border-gray-300 rounded px-3 py-2 mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="text-sm px-4 py-2 rounded bg-plank-pink text-white hover:bg-pink-700"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveChartModal;
