import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Save, Star, SquareArrowOutUpRight, X, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { formatHistoryDate } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface StatHistoryItem {
  historical_id: number;
  title?: string | null;
  historical_date?: string | null;
  json_results?: string | null;
  columns_order?: string | null;
  grid_state?: unknown;
  action?: string | null;
}

interface StatChartHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onConfirmDelete: () => void;
  onSave: () => void;
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
  justSaved: boolean;
  isStarred: boolean;
  onToggleStar: () => void;
  openTable: boolean;
  statId: number | string;
  onHistorySelect: (item: StatHistoryItem, context: { index: number; label: string }) => void;
  onHistoryReset: () => void;
  selectedHistoryId: number | null;
  selectedHistoryLabel?: string;
  isHistoryMode?: boolean;
}

// Componente react vero e proprio: riceve la props -> gestisce logica (stato,funzioni, effetti) -> ritorna JSX
const StatChartHeader = ({
  title,
  onTitleChange,
  onConfirmDelete,
  onSave,
  showDialog,
  setShowDialog,
  justSaved,
  isStarred,
  onToggleStar,
  openTable,
  statId,
  onHistorySelect,
  onHistoryReset,
  selectedHistoryId,
  selectedHistoryLabel,
  isHistoryMode = false,
}: StatChartHeaderProps) => {
      const [editing, setEditing] = useState(false);
      const [localTitle, setLocalTitle] = useState(title);
      const inputRef = useRef<HTMLInputElement>(null);
      const { t } = useTranslation();
      const [history, setHistory] = useState<StatHistoryItem[]>([]);
      const [historyLoaded, setHistoryLoaded] = useState(false); // Indica se caricato - usato come check per non ricaricare
      const [historyLoading, setHistoryLoading] = useState(false); // Indica se in caricamento
      const [historyError, setHistoryError] = useState<string | null>(null);

      useEffect(() => {
        setLocalTitle(title);
      }, [title]);

      useEffect(() => {
        if (editing) inputRef.current?.focus();
      }, [editing]);

      // Reset quando lo statId cambia
      useEffect(() => {
        setHistory([]);
        setHistoryLoaded(false);
        setHistoryError(null);
      }, [statId]);

      // Carica la history di un chart
      const handleHistoryLoad = async (open: boolean) => {
        if (!open || historyLoaded || historyLoading) return;

        setHistoryLoading(true);
        setHistoryError(null);

        try {
          const response = await apiFetch<StatHistoryItem[]>(`v1/stats/${statId}/history`);
          setHistory(response.slice(0,20));
          setHistoryLoaded(true);
        } catch (error) {
          console.error('Error while fetching chart history:', error);
          if (error instanceof Error && error.message.includes('404')) {
            setHistory([]);
            setHistoryLoaded(true);
          } else {
            setHistoryError('Unable to load chart history');
          }
        } finally {
          setHistoryLoading(false);
        }
      };

      return (
        <div className="px-4 py-2 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div onDoubleClick={() => setEditing(true)} className="flex-1 cursor-text">
            {editing ? (
              <input
                ref={inputRef}
                className="text-base font-semibold text-gray-800 bg-white border-b border-gray-300 focus:outline-none focus:border-gray-200"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => {
                  const trimmed = localTitle.trim();
                  if (trimmed === '') {
                    setLocalTitle(title); // ripristina il titolo originale
                  } else if (trimmed !== title) {
                    onTitleChange(trimmed);
                  }
                  setEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    inputRef.current?.blur();
                  }
                }}
              />
            ) : (
              <h3 className="text-base font-semibold text-gray-800 truncate">
                {localTitle.trim() === '' ? (
                  <span className="italic text-gray-400"> {t('chart.no_title')}</span>
                ) : (
                  localTitle
                )}
              </h3>
            )}
          </div>

          <div className="flex gap-1 items-center ml-2">
            {justSaved && (
              <span className="text-xs text-gray-500 font-medium animate-fade-in">
                {t('label.saved')}
              </span>
            )}

            {selectedHistoryLabel ? (
              <span
                className="text-xs text-gray-500 max-w-[180px] truncate"
                title={selectedHistoryLabel}
              >
                {selectedHistoryLabel}
              </span>
            ) : null}

            {/* --HISTORY-- */}
            <DropdownMenu onOpenChange={handleHistoryLoad}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8" title='Chart history'>
                  <Clock className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 max-h-72 overflow-y-scroll">
                <DropdownMenuLabel>{t('history.chart_history')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {historyLoading ? (
                  <DropdownMenuItem disabled>{t('history.loading')}</DropdownMenuItem>
                ) : historyError ? (
                  <DropdownMenuItem disabled>{t('history.error')}</DropdownMenuItem>
                ) : history.length === 0 ? (
                  <DropdownMenuItem disabled>{t('history.no_chart')}</DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      onSelect={() => onHistoryReset()}
                      className={selectedHistoryId === null ? 'bg-gray-100 text-gray-900' : ''}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t('history.current_version')}</span>
                        <span className="text-xs text-gray-500">{t('history.recent_data')}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {history.map((item, index) => {
                      const versionTitle = `${t('history.version')} ${index + 1}`;
                      const formattedDate = formatHistoryDate(item.historical_date);
                      const displayDate = formattedDate ?? t('history.date_not_available');
                      const isSelected = selectedHistoryId === item.historical_id;

                      return (
                        <DropdownMenuItem
                          key={item.historical_id}
                          onSelect={() =>
                            onHistorySelect(item, {
                              index,
                              label: formattedDate ? `${versionTitle} • ${formattedDate}` : versionTitle,
                            })
                          }
                          className={isSelected ? 'bg-gray-100 text-gray-900' : ''}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{versionTitle}</span>
                            <span className="text-xs text-gray-500">{displayDate}</span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* --SAVE-- */}
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onSave} disabled={isHistoryMode}>
              <Save className="w-4 h-4" />
            </Button>
            
            {/* --PREFERITO-- */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={onToggleStar}
              aria-label="Segna come preferito"
              disabled={isHistoryMode}
            >
              {isStarred ? (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              ) : (
              <Star className="w-4 h-4 text-black" />
              )}
            </Button>

            {/* --LINK TABELLA-GRAFICO-- */}
            {openTable ? (
              <Link to={`/stat/${statId}`}>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <SquareArrowOutUpRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : null}

            {/* --ELIMINA-- */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-lg w-8 h-8" disabled={isHistoryMode}>
                  <X className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <div className="text-sm">{t('chart.confirm_delete')}</div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    {t('button.cancel')}
                  </Button>
                  <Button
                    className="bg-plank-pink text-white hover:bg-plank-pink/90"
                    onClick={onConfirmDelete}
                  >
                    {t('button.delete')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      );
    };

export default StatChartHeader;