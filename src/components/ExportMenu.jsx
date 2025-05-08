import { useState, useRef, useEffect } from 'react';

const ExportMenu = ({ gridRef, filename = 'export', sheetName = 'Sheet1' }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCsvExport = () => {
    gridRef.current?.api.exportDataAsCsv({ fileName: `${filename}.csv` });
    setOpen(false);
  };

  const handleExcelExport = () => {
    if (gridRef.current?.api.exportDataAsExcel) {
      gridRef.current.api.exportDataAsExcel({
        fileName: `${filename}.xlsx`,
        sheetName,
      });
    } else {
      alert('Excel export requires AG Grid Enterprise');
    }
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-plank-blue hover:bg-plank-blue/80 !text-white !text-2xl !py-3 !px-5 !rounded-xl"
      >
        Export ▾
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-50 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 text-sm">
            <button
              onClick={handleCsvExport}
              className="w-full text-center !text-2xl px-4 py-2 hover:bg-gray-100"
            >
              Export CSV
            </button>
            <button
              onClick={handleExcelExport}
              className="w-full text-center !text-2xl px-4 py-2 hover:bg-gray-100"
            >
              Export Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
