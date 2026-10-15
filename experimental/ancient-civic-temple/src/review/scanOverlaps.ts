/**
 * Pre-review self-check: scans positive-volume overlaps of envelope solids
 * (wall columns, roof slabs, coping, plinth and floor slabs) over a plan grid.
 * At each grid point, gathers vertical intervals of solids containing that
 * point in plan and measures overlap depths between different solid groups.
 * Face contact (depth ≤ tolerance) is not overlap. Results are measurements,
 * without proving visual acceptance or document compliance.
 */
import { planeHeight } from "../geometry/planeHeight";
import { ScanSolid } from "./ScanSolid";
import { OverlapPair } from "./OverlapPair";
import { lastScan } from "./lastScan";
import { strictlyInside } from "./strictlyInside";

/** Collects vertical interval overlaps (depth > tolerance) between different groups at each spacing-grid point. */
export const scanOverlaps = (solids: readonly ScanSolid[], spacing = 0.01, tolerance = 1e-3): OverlapPair[] => {
  const xs = solids.flatMap((s) => s.polygon.map((p) => p.x));
  const zs = solids.flatMap((s) => s.polygon.map((p) => p.z));
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const boxes = solids.map((s) => ({
    west: Math.min(...s.polygon.map((p) => p.x)), east: Math.max(...s.polygon.map((p) => p.x)),
    north: Math.min(...s.polygon.map((p) => p.z)), south: Math.max(...s.polygon.map((p) => p.z)),
  }));
  // Index only solids whose bounding boxes touch each 0.5m bucket, avoiding a full scan per grid point.
  const bucket = 0.5;
  const index = new Map<string, number[]>();
  boxes.forEach((box, i) => {
    for (let bx = Math.floor(box.west / bucket); bx <= Math.floor(box.east / bucket); ++bx) {
      for (let bz = Math.floor(box.north / bucket); bz <= Math.floor(box.south / bucket); ++bz) {
        const key = `${bx},${bz}`;
        index.set(key, [...index.get(key) ?? [], i]);
      }
    }
  });
  const pairs = new Map<string, OverlapPair>();
  const steps = { x: Math.round((x1 - x0) / spacing), z: Math.round((z1 - z0) / spacing) };
  // Offset samples by half a cell so the grid avoids boundary lines.
  for (let ix = 0; ix < steps.x; ++ix) {
    const x = x0 + (ix + 0.5) * spacing;
    for (let iz = 0; iz < steps.z; ++iz) {
      const z = z0 + (iz + 0.5) * spacing;
      const p = { x, z };
      const hits: Array<{ group: string; low: number; high: number }> = [];
      for (const i of index.get(`${Math.floor(x / bucket)},${Math.floor(z / bucket)}`) ?? []) {
        const solid = solids[i]!;
        const box = boxes[i]!;
        if (x <= box.west || x >= box.east || z <= box.north || z >= box.south) continue;
        if (!strictlyInside(solid.polygon, p, 1e-6)) continue;
        hits.push({ group: solid.group, low: planeHeight(solid.bottom, p), high: planeHeight(solid.top, p) });
      }
      for (let i = 0; i < hits.length; ++i) {
        for (let j = i + 1; j < hits.length; ++j) {
          const [a, b] = [hits[i]!, hits[j]!];
          if (a.group === b.group) continue;
          const depth = Math.min(a.high, b.high) - Math.max(a.low, b.low);
          if (depth <= tolerance) continue;
          const [ga, gb] = [a.group, b.group].sort((m, n) => m.localeCompare(n)) as [string, string];
          const key = `${ga}|${gb}`;
          const pair = pairs.get(key) ?? {
            a: ga, b: gb, samples: 0, maxDepth: 0, at: { x, z, low: 0, high: 0 },
            bounds: { west: x, east: x, north: z, south: z },
          };
          pair.samples += 1;
          pair.bounds = { west: Math.min(pair.bounds.west, x), east: Math.max(pair.bounds.east, x),
            north: Math.min(pair.bounds.north, z), south: Math.max(pair.bounds.south, z) };
          if (depth > pair.maxDepth) {
            pair.maxDepth = depth;
            pair.at = { x, z, low: Math.max(a.low, b.low), high: Math.min(a.high, b.high) };
          }
          pairs.set(key, pair);
        }
      }
    }
  }
  lastScan.samples = steps.x * steps.z;
  return [...pairs.values()].sort((m, n) => n.maxDepth - m.maxDepth);
};

