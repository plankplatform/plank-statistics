import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface StatHeaderProps {
  groupName: string;
  title: string;
  description?: string;
  hasChart: boolean;
  onSaveChart: () => void;
  view: 'table' | 'graphs';
  onChangeView: (view: 'table' | 'graphs') => void;
  frequency: number;
  lastExecTime: Date;
  tableFilters: any;
  tableColumnState: any;
  statId: number | string;
  onReset: () => void;
  onSaveGridState: () => void;
  justSaved: boolean;
}

const StatHeader = ({
  groupName,
  title,
  description,
  hasChart,
  onSaveChart,
  view,
  onChangeView,
  frequency,
  lastExecTime,
  tableFilters,
  tableColumnState,
  statId,
  onReset,
  onSaveGridState,
  justSaved,
}: StatHeaderProps) => {
  const { t } = useTranslation();

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatFrequency = (minutes: number): string => {
    if (minutes < 60) return `${minutes} ${t('time.minute')}${minutes > 1 ? 'i' : ''}`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours} ${hours === 1 ? t('time.hour') : t('time.hours')}`;
    const days = hours / 24;
    return `${days} ${days === 1 ? t('time.day') : t('time.days')}`;
  };

  return (
    <div className="mb-2 pb-2">
      <div className="grid grid-cols-3 items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-plank-blue transition"
            title="Torna indietro"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="text-lg font-medium">{groupName}</div>
          <span className="text-base text-gray-700">{title}</span>
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

        <div className="flex justify-end items-center gap-3">
          {justSaved && (
            <span className="text-xs text-gray-500 font-medium animate-fade-in">
              {t('label.saved')}
            </span>
          )}

          {view === 'table' && (
            <>
              <TooltipProvider>
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
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 mt-1 text-sm text-gray-600">
        <div className="col-span-1 truncate pr-4">{description}</div>
        <div className="col-span-2 flex justify-end gap-6">
          <span>
            {t('label.last_update')}{' '}
            {lastExecTime
              ? format(toZonedTime(new Date(lastExecTime), timeZone), 'dd/MM/yyyy HH:mm')
              : 'N/D'}
          </span>
          <span>
            {t('label.refresh_interval')} {formatFrequency(frequency)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatHeader;
