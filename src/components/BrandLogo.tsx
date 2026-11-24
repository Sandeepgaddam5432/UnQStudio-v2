import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function BrandLogo({
  className,
  showWordmark = false,
  wordmarkClassName,
}: BrandLogoProps) {
  if (!showWordmark) {
    return (
      <img
        src={BRAND.logoUrl}
        alt={BRAND.name}
        className={cn('rounded-xl object-contain select-none', className)}
        draggable={false}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <img
        src={BRAND.logoUrl}
        alt={BRAND.name}
        className={cn('w-7 h-7 rounded-lg object-contain flex-shrink-0', className)}
        draggable={false}
      />
      <span
        className={cn(
          'font-semibold tracking-tight text-foreground text-base leading-none',
          wordmarkClassName,
        )}
      >
        {BRAND.name}
      </span>
    </span>
  );
}
