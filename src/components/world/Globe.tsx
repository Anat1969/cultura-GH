import React, { useEffect, useMemo, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoDistance, GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import countries110 from 'world-atlas/countries-110m.json';
import { WorldGroup, WorldItem } from '@/lib/world';
import { countryOf } from '@/data/geo';

const SIZE = 520;
const land = feature(
  countries110 as unknown as Topology,
  (countries110 as unknown as Topology).objects.countries as GeometryCollection
) as unknown as GeoPermissibleObjects;

interface GlobeProps {
  groups: WorldGroup[];
  selected: string | null;
  onSelectGroup: (key: string | null) => void;
  onOpen: (item: WorldItem) => void;
}

/**
 * A slowly turning globe with a dot for every word, coloured by its group.
 * Drag to turn it; choosing a group turns the globe to face it. With reduced
 * motion it stands still and only turns when asked.
 */
const Globe: React.FC<GlobeProps> = ({ groups, selected, onSelectGroup, onOpen }) => {
  const [rotation, setRotation] = useState<[number, number]>([-35, -25]);
  const [hover, setHover] = useState<WorldItem | null>(null);
  const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null);
  const target = useRef<[number, number] | null>(null);
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Turn: toward a chosen group, else a slow drift unless motion is reduced.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setRotation(([lng, lat]) => {
        if (drag.current) return [lng, lat];
        const t = target.current;
        if (t) {
          const dl = ((t[0] - lng + 540) % 360) - 180;
          const dp = t[1] - lat;
          if (Math.abs(dl) < 0.3 && Math.abs(dp) < 0.3) {
            target.current = null;
            return t;
          }
          return [lng + dl * 0.08, lat + dp * 0.08];
        }
        return reduced || hover ? [lng, lat] : [lng + 0.08, lat];
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, hover]);

  useEffect(() => {
    const g = groups.find(x => x.key === selected);
    if (g?.center) target.current = [-g.center[0], -g.center[1] * 0.8];
  }, [selected, groups]);

  const projection = useMemo(
    () => geoOrthographic().scale(SIZE / 2 - 8).translate([SIZE / 2, SIZE / 2]).rotate([rotation[0], rotation[1], 0]).clipAngle(90),
    [rotation]
  );
  const path = geoPath(projection);
  const center: [number, number] = [-rotation[0], -rotation[1]];

  const dots = groups.flatMap(g =>
    g.items
      .filter(it => it.point && geoDistance(it.point, center) < Math.PI / 2 - 0.02)
      .map(it => ({ it, g, xy: projection(it.point!)! }))
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, r: rotation };
    target.current = null;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const k = 0.35;
    const { x, y, r } = drag.current;
    setRotation([r[0] + (e.clientX - x) * k, Math.max(-80, Math.min(80, r[1] - (e.clientY - y) * k))]);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full touch-none select-none"
        direction="ltr"
        role="img"
        aria-label="גלובוס של מקורות המילים. גררי כדי לסובב."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <radialGradient id="globe-shade" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--background))" />
          </radialGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 8} fill="url(#globe-shade)" stroke="hsl(var(--border))" />
        <path d={path(geoGraticule10()) ?? ''} fill="none" stroke="hsl(var(--border))" strokeOpacity={0.45} strokeWidth={0.5} />
        <path d={path(land) ?? ''} fill="hsl(var(--muted))" stroke="hsl(var(--background))" strokeWidth={0.4} />
        {dots.map(({ it, g, xy }) => {
          const dim = selected && selected !== g.key;
          return (
            <g
              key={it.article.id}
              transform={`translate(${xy[0]},${xy[1]})`}
              className="cursor-pointer"
              onPointerEnter={() => setHover(it)}
              onPointerLeave={() => setHover(null)}
              onClick={e => {
                e.stopPropagation();
                if (selected !== g.key) onSelectGroup(g.key);
                else onOpen(it);
              }}
            >
              <circle r={9} fill="transparent" />
              <circle
                r={hover?.article.id === it.article.id ? 6 : 4}
                fill={g.color}
                fillOpacity={dim ? 0.18 : 0.95}
                stroke="hsl(var(--background))"
                strokeWidth={1}
              />
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute right-1/2 top-3 translate-x-1/2 border border-border bg-background/90 px-3 py-2 text-center shadow-lg backdrop-blur"
          role="status"
        >
          <p className="flex items-center justify-center gap-1.5 text-sm font-bold">
            {hover.code && (
              <img src={`https://flagcdn.com/${hover.code.toLowerCase()}.svg`} alt="" className="h-3 w-4 object-cover" />
            )}
            {hover.article.concept}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {[hover.article.dimensions.origin.literal, hover.article.dimensions.origin.place || countryOf(hover.code)?.he]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Globe;
