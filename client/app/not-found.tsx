import { LogoMark } from "@/components/LogoMark";
import { NotFoundActions } from "@/components/NotFoundActions";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.955 0.012 83)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 940,
          background: "oklch(0.99 0.007 83)",
          border: "1px solid oklch(0.82 0.014 78)",
          borderRadius: 6,
          boxShadow: "0 24px 60px oklch(0.24 0.03 55 / 0.12)",
          overflow: "hidden",
          display: "flex",
          minHeight: 480,
        }}
      >
        {/* Brand panel */}
        <div
          style={{
            width: "44%",
            flexShrink: 0,
            background: "oklch(0.26 0.02 52)",
            backgroundImage:
              "repeating-linear-gradient(0deg, oklch(0.93 0.012 83 / 0.045) 0 1px, transparent 1px 34px)",
            padding: "32px 36px",
            flexDirection: "column",
          }}
          className="hidden md:flex"
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 40,
            }}
          >
            <LogoMark size={24} dark />
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "oklch(0.93 0.012 83)",
              }}
            >
              SmartAlert
            </span>
          </div>

          {/* Big code */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "oklch(0.68 0.14 45)",
                marginBottom: 12,
              }}
            >
              Error 404
            </p>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 96,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: "oklch(0.93 0.012 83)",
              }}
            >
              404
            </p>
          </div>

          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.82 0.012 83 / 0.72)",
              marginTop: 32,
            }}
          >
            Faculty of Physical Sciences · Dept. of Computer Science
          </p>
        </div>

        {/* Content side */}
        <div
          style={{
            flex: 1,
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Mobile-only logo */}
          <div
            style={{
              alignItems: "center",
              gap: 9,
              marginBottom: 28,
            }}
            className="flex md:hidden"
          >
            <LogoMark size={24} />
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "oklch(0.24 0.014 55)",
              }}
            >
              SmartAlert
            </span>
          </div>

          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.55 0.16 41)",
              marginBottom: 14,
            }}
            className="md:hidden"
          >
            Error 404
          </p>

          <h1
            style={{
              fontSize: 27,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "oklch(0.24 0.014 55)",
              marginBottom: 8,
            }}
          >
            This page isn&apos;t on the timetable.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "oklch(0.5 0.012 55)",
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            The link may be out of date, or the page may have moved. Nothing is
            wrong with your schedule — let&apos;s get you back to it.
          </p>

          <NotFoundActions />
        </div>
      </div>
    </div>
  );
}