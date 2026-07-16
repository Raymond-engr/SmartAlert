import { getStatusColor, getStatusLabel } from "@/lib/utils";
import type { SessionStatus } from "@/types";

interface StatusChipProps {
  status: SessionStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-ibm-plex-mono), monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "2px 7px",
        border: "1px solid oklch(0.87 0.014 78)",
        borderRadius: 2,
        color,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
