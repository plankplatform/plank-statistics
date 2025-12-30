import { ArrowLeft, Save, RotateCcw, Download, Clock, Table2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatHistoryDate } from '@/lib/utils';
import { StatHistoryItem } from './StatChartHeader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface TableHistoryControl {
  items: StatHistoryItem[];
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: StatHistoryItem, ctx: { index: number; label: string }) => void;
  onReset: () => void;
  selectedId: number | null;
  selectedLabel?: string;
}

interface StatHeaderProps {
  title: string;
  description?: string;
  view: 'table' | 'graphs';
  onChangeView: (view: 'table' | 'graphs') => void;
  frequency: number;
  lastExecTime: string;
  onReset: () => void;
  onSaveGridState: () => void;
  justSaved: boolean;
  onDownloadCsv: () => void;
  onDownloadExcel: () => void;
  tableHistory?: TableHistoryControl;
  disableSave?: boolean;
  onSaveTableConfig: () => void;
}

const StatHeader = ({
  title,
  description,
  view,
  onChangeView,
  frequency,
  lastExecTime,
  onReset,
  onSaveGridState,
  justSaved,
  onDownloadCsv,
  onDownloadExcel,
  tableHistory,
  disableSave = false,
  onSaveTableConfig,
}: StatHeaderProps) => {
  const { t } = useTranslation();

  const utcDate = new Date(lastExecTime.replace(' ', 'T') + 'Z');
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatFrequency = (minutes: number): string => {
    if (minutes < 60) return `${minutes} ${minutes === 1 ? t('time.minute') : t('time.minutes')}`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours} ${hours === 1 ? t('time.hour') : t('time.hours')}`;
    const days = hours / 24;
    return `${days} ${days === 1 ? t('time.day') : t('time.days')}`;
  };

  return (
    <div className="mb-2 pb-2">
      <div className="flex flex-col md:grid md:grid-cols-3 md:items-center gap-2">
        <div className="flex items-center gap-3">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="w-10 h-10">
                <Link to="/">
                  <ArrowLeft className="size-5 text-gray-800" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tooltip.back')}</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-lg">{title}</span>
        </div>

        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) onChangeView(value as 'table' | 'graphs');
            }}
            className="bg-gray-100 rounded-md"
          >
            <ToggleGroupItem
              value="table"
              className="px-4 py-2 text-sm data-[state=on]:bg-plank-pink data-[state=on]:text-white"
            >
              {t('view.table')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="graphs"
              className="px-4 py-2 text-sm data-[state=on]:bg-plank-pink data-[state=on]:text-white"
            >
              {t('view.graphs')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex justify-start md:justify-end items-center gap-3">
          {justSaved && (
            <span className="text-xs text-gray-500 font-medium animate-fade-in">
              {t('label.saved')}
            </span>
          )}

          {/* Titolo: label(versione + data) visibile solo se viene cliccata una versione diversa dalla "most recent date" */}
          {view === 'table' && tableHistory?.selectedLabel ? (
            <span
              className="text-xs text-gray-500 max-w-[200px] truncate"
              title={tableHistory.selectedLabel}
            >
              {tableHistory.selectedLabel}
            </span>
          ) : null}

          {view === 'table' && (
            <>
              {/* Desktop version: Save, Reset, Export */}
              <div className="hidden sm:flex items-center gap-3">
                {/* -- HISTORY -- */}
                <DropdownMenu onOpenChange={tableHistory?.onOpenChange}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-10 h-10">
                          <Clock className="size-5 text-gray-800" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('tooltip.load_history')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-64 max-h-72 overflow-y-scroll">
                    <DropdownMenuLabel>{t('history_table.table_history')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {tableHistory?.loading ? (
                      <DropdownMenuItem disabled>{t('history_table.loading')}</DropdownMenuItem>
                    ) : tableHistory?.error ? (
                      <DropdownMenuItem disabled>{t('history_table.error')}</DropdownMenuItem>
                    ) : tableHistory?.items.length === 0 ? (
                      <DropdownMenuItem disabled>{t('history_table.no_table')}</DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onSelect={() => tableHistory?.onReset()}
                          className={
                            tableHistory?.selectedId === null ? 'bg-gray-100 text-gray-900' : ''
                          }
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {t('history_table.current_version')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {t('history_table.recent_data')}
                            </span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {tableHistory?.items.map((item, index) => {
                          const versionTitle = `${t('history_table.version')} ${index + 1}`;
                          const formattedDate = formatHistoryDate(item.historical_date);
                          const displayDate =
                            formattedDate ?? t('history_table.date_not_available');
                          const isSelected = tableHistory.selectedId === item.historical_id;
                          const label = formattedDate
                            ? `${versionTitle} • ${formattedDate}`
                            : versionTitle;

                          return (
                            <DropdownMenuItem
                              key={item.historical_id}
                              onSelect={() => tableHistory.onSelect(item, { index, label })}
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

                {/* -- SAVE -- */}
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10"
                      onClick={onSaveGridState}
                      disabled={disableSave}
                    >
                      <Save className="size-5 text-gray-800" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('tooltip.save_table')}</p>
                  </TooltipContent>
                </Tooltip>

                {/* -- SAVE TABLE CONFIG -- */}
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10"
                      onClick={onSaveTableConfig}
                      disabled={disableSave}
                    >
                      <Table2 className="size-5 text-gray-800" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('table_config.save_button')}</p>
                  </TooltipContent>
                </Tooltip>

                {/* -- RESET -- */}
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10" onClick={onReset}>
                      <RotateCcw className="size-5 text-gray-800" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('tooltip.reset_table')}</p>
                  </TooltipContent>
                </Tooltip>

                {/* -- EXPORT -- */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 px-5 gap-2 border border-gray-300 hover:bg-muted transition-colors"
                    >
                      <Download className="size-5" />
                      {t('label.export')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={onDownloadCsv}>
                      {t('label.export_csv')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDownloadExcel}>
                      {t('label.export_excel')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-9 mt-2 text-sm text-gray-600 gap-1 md:gap-0">
        <div className="pr-4 md:col-span-4">{description}</div>
        <div className="md:col-span-5 flex flex-col md:flex-row md:justify-end gap-1 md:gap-6">
          <span>
            {t('label.last_update')}{' '}
            {lastExecTime
              ? format(toZonedTime(new Date(utcDate), timeZone), 'dd/MM/yyyy HH:mm')
              : 'N/D'}
          </span>
          <span>
            {t('label.refresh_interval')} {formatFrequency(frequency)}
          </span>
        </div>
      </div>

      {/* Mobile export button under description */}
      {view === 'table' && (
        <div className="mt-4 sm:hidden flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 px-5 gap-2 border border-gray-300 hover:bg-muted transition-colors"
              >
                <Download className="size-5" />
                {t('label.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-32">
              <DropdownMenuItem onClick={onDownloadCsv}>{t('label.export_csv')}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDownloadExcel}>
                {t('label.export_excel')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default StatHeader;
