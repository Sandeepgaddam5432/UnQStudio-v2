import { BrandLogo, type BrandLogoProps } from '@/components/BrandLogo';

export type ShakespeareLogoProps = BrandLogoProps;

/** Backwards-compatible alias delegating to the env-driven BrandLogo. */
export function ShakespeareLogo(props: ShakespeareLogoProps) {
  return <BrandLogo {...props} />;
}
