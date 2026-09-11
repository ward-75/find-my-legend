"use client";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { DOMAIN_KEYS } from "@/lib/types";
import { DOMAIN_META } from "@/lib/labels";
import type { DomainKey, DomainVector } from "@/lib/types";

interface TickProps { x?: number | string; y?: number | string; payload?: { value: DomainKey }; textAnchor?: string }

function DomainTick({ x = 0, y = 0, payload, textAnchor }: TickProps) {
  if (!payload) return null;
  const m = DOMAIN_META[payload.value];
  return (
    <text x={Number(x)} y={Number(y)} dy={4} textAnchor={(textAnchor as "start" | "middle" | "end") ?? "middle"} fill={m.color} fontSize={13} fontWeight={600}>
      {m.label}
    </text>
  );
}

/** 6축 도메인 레이더. compare를 주면 전설 도메인을 점선으로 겹쳐 그린다. */
export function DomainRadar({ user, compare, height = 280 }: { user: DomainVector; compare?: { values: DomainVector; label: string }; height?: number }) {
  const data = DOMAIN_KEYS.map((d) => ({ domain: d, user: user[d], legend: compare?.values[d] ?? 0 }));
  const summary = DOMAIN_KEYS.map((d) => `${DOMAIN_META[d].label} ${Math.round(user[d])}`).join(", ");
  return (
    <figure className="m-0" aria-label={`도메인 성향: ${summary}`}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="rgba(236,228,208,0.14)" />
            <PolarAngleAxis dataKey="domain" tick={<DomainTick />} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {compare && (
              <Radar dataKey="legend" name={compare.label} stroke="#c8a15a" strokeDasharray="4 3" fill="#c8a15a" fillOpacity={0.08} isAnimationActive={false} />
            )}
            <Radar dataKey="user" name="당신" stroke="#ece4d0" strokeWidth={2} fill="#ece4d0" fillOpacity={0.2} dot={{ r: 2.5, fill: "#ece4d0" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {compare && (
        <figcaption className="mt-1 flex justify-center gap-5 text-xs text-haze">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-vellum" />당신</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-brass" />{compare.label}</span>
        </figcaption>
      )}
    </figure>
  );
}
