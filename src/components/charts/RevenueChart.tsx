import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint, TimeRange } from "@/types";

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
];

export function RevenueChart({
  data,
  range,
  onRangeChange,
  title = "Revenue Overview",
}: {
  data: RevenuePoint[];
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  title?: string;
}) {
  return (
    <div className="card">
      <div className="card__header">
        <h3>{title}</h3>
        <div className="segmented">
          {RANGES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={range === item.value ? "is-active" : ""}
              onClick={() => onRangeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card__body" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#005AFA" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#005AFA" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9aa3b2" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9aa3b2" />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#005AFA"
              fill="url(#revFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#30B1FD"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
