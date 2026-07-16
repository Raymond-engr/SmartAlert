interface LogoMarkProps {
  size?: number;
  dark?: boolean;
}

export function LogoMark({ size = 22, dark = false }: LogoMarkProps) {
  const brand = dark ? "oklch(0.62 0.16 41)" : "oklch(0.55 0.16 41)";
  const bg = dark ? "oklch(0.26 0.02 52)" : "oklch(0.99 0.007 83)";

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${brand} 0 46%, ${bg} 46% 54%, ${brand} 54% 100%)`,
        flexShrink: 0,
      }}
    />
  );
}
