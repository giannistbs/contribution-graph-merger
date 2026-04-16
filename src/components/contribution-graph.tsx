import { useState, useMemo, useCallback, useRef } from "react";
import type { MergedContributions } from "@shared/schema";

const CELL_SIZE = 10;
const CELL_GAP = 3;
const CELL_RADIUS = 2;

const LEVEL_COLORS = [
  "var(--gh-level-0)",
  "var(--gh-level-1)",
  "var(--gh-level-2)",
  "var(--gh-level-3)",
  "var(--gh-level-4)",
];

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface TooltipData {
  x: number;
  y: number;
  date: string;
  count: number;
  perUser: Record<string, number>;
  showBelow?: boolean;
}

export default function ContributionGraph({ data }: { data: MergedContributions }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Organize days into weeks (columns), starting from Sunday
  const { weeks, monthLabels } = useMemo(() => {
    if (data.days.length === 0) return { weeks: [], monthLabels: [] };

    // Sort days by date
    const sorted = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = new Date(sorted[0].date + "T00:00:00");
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday

    // Build the day map for quick lookup
    const dayMap = new Map(sorted.map((d) => [d.date, d]));

    // Start from the first Sunday on or before the first date
    const startDate = new Date(firstDate);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    // Build weeks
    const weeksArr: (typeof sorted[0] | null)[][] = [];
    const currentDate = new Date(startDate);
    const endDate = new Date(sorted[sorted.length - 1].date + "T00:00:00");

    while (currentDate <= endDate) {
      const week: (typeof sorted[0] | null)[] = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayData = dayMap.get(dateStr);
        week.push(dayData || null);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeksArr.push(week);
    }

    // Calculate month label positions
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((week, colIndex) => {
      // Use the first day of the week that has data
      const firstDay = week.find((d) => d !== null);
      if (firstDay) {
        const month = new Date(firstDay.date + "T00:00:00").getMonth();
        if (month !== lastMonth) {
          // Only add label if there's enough space from the last label
          if (labels.length === 0 || colIndex - labels[labels.length - 1].col >= 3) {
            labels.push({ label: MONTH_LABELS[month], col: colIndex });
          }
          lastMonth = month;
        }
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [data.days]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, day: typeof data.days[0]) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const relativeY = rect.top - containerRect.top;
      const showBelow = relativeY < 80; // Show tooltip below when near top
      setTooltip({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: showBelow
          ? rect.bottom - containerRect.top + 8
          : rect.top - containerRect.top - 8,
        date: day.date,
        count: day.count,
        perUser: day.perUser,
        showBelow,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const svgWidth = 28 + weeks.length * (CELL_SIZE + CELL_GAP) + 16;
  const svgHeight = 20 + 7 * (CELL_SIZE + CELL_GAP);

  return (
    <div data-testid="contribution-graph">
      {/* Stats header */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground font-mono">
            {data.totalContributions.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            contributions in the last year
          </span>
        </div>
        {data.users.map((user) => (
          <div key={user.username} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <a
              href={`https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              @{user.username}
            </a>
            <span className="text-xs text-muted-foreground/60 font-mono">
              {user.totalContributions.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        className="relative rounded-md border border-border bg-card p-4 overflow-x-auto overflow-y-visible"
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block"
          data-testid="contribution-svg"
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={28 + m.col * (CELL_SIZE + CELL_GAP)}
              y={10}
              fill="hsl(215, 10%, 55%)"
              fontSize={10}
              fontFamily="Inter, sans-serif"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map(
            (label, i) =>
              label && (
                <text
                  key={i}
                  x={0}
                  y={20 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 1}
                  fill="hsl(215, 10%, 55%)"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                >
                  {label}
                </text>
              )
          )}

          {/* Cells */}
          {weeks.map((week, colIndex) =>
            week.map((day, rowIndex) => {
              if (!day) return null;
              return (
                <rect
                  key={`${colIndex}-${rowIndex}`}
                  x={28 + colIndex * (CELL_SIZE + CELL_GAP)}
                  y={18 + rowIndex * (CELL_SIZE + CELL_GAP)}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={CELL_RADIUS}
                  ry={CELL_RADIUS}
                  className="cursor-pointer"
                  style={{
                    fill: LEVEL_COLORS[day.level],
                    outline: "1px solid rgba(128, 128, 128, 0.1)",
                    outlineOffset: "-1px",
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, day)}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="contribution-tooltip"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: tooltip.showBelow
                ? "translateX(-50%)"
                : "translate(-50%, -100%)",
              position: "absolute",
              zIndex: 50,
            }}
          >
            <div className="font-semibold">
              {tooltip.count === 0
                ? "No contributions"
                : `${tooltip.count} contribution${tooltip.count !== 1 ? "s" : ""}`}{" "}
              on {formatDate(tooltip.date)}
            </div>
            {tooltip.count > 0 &&
              Object.keys(tooltip.perUser).length > 1 && (
                <div className="mt-1 border-t border-border pt-1">
                  {Object.entries(tooltip.perUser)
                    .filter(([, count]) => count > 0)
                    .map(([username, count]) => (
                      <div
                        key={username}
                        className="flex items-center gap-1.5 text-[11px]"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              data.users.find((u) => u.username === username)
                                ?.color || "currentColor",
                          }}
                        />
                        <span className="text-muted-foreground">@{username}</span>
                        <span className="text-foreground">{count}</span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-muted-foreground mr-1">Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: color,
              outline: "1px solid rgba(128, 128, 128, 0.1)",
              outlineOffset: "-1px",
            }}
          />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">More</span>
      </div>
    </div>
  );
}