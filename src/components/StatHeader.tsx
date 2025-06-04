import { ArrowLeft, Save, RotateCcw, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

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

          {view === 'table' && (
            <>
              {/* Desktop version: Save, Reset, Export */}
              <div className="hidden sm:flex items-center gap-3">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10"
                      onClick={onSaveGridState}
                    >
                      <Save className="size-5 text-gray-800" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('tooltip.save_table')}</p>
                  </TooltipContent>
                </Tooltip>

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
