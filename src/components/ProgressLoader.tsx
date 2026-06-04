import { cn } from '@/lib/utils';

type ProgressLoaderProps = {
  className?: string;
  progress: number;
  label?: string;
};

const ProgressLoader = ({ className, progress, label }: ProgressLoaderProps) => {
  const normalizedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className={cn('flex min-h-screen items-center justify-center px-6', className)}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-gray-700">{label ?? 'Loading data...'}</p>
          <span className="text-sm font-semibold text-plank-pink">{normalizedProgress}%</span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-gray-100"
          aria-label={label ?? 'Loading progress'}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={normalizedProgress}
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-plank-pink transition-[width] duration-300 ease-out"
            style={{ width: `${normalizedProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressLoader;
