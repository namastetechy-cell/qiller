import logoUrl from "./logo.svg";

export function Logo({ size = 32 }: { size?: number }) {
  return <img src={logoUrl} width={size} height={size} alt="" draggable={false} />;
}
