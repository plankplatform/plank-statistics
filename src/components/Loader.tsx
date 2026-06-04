import { cn } from '@/lib/utils';

type LoaderProps = {
  className?: string;
};

const Loader = ({ className }: LoaderProps) => {
  return (
    <div className={cn('flex justify-center items-center min-h-screen', className)}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-plank-pink border-t-transparent" />
    </div>
  );
};

export default Loader;
