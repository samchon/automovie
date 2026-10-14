/**
 * Pre-review self-check: scans positive-volume overlaps of envelope solids
 * (wall columns, roof slabs, coping, plinth and floor slabs) over a plan grid.
 * At each grid point, gathers vertical intervals of solids containing that
 * point in plan and measures overlap depths between different solid groups.
 * Face contact (depth ≤ tolerance) is not overlap. Results are measurements,
 * without proving visual acceptance or document compliance.
 */
import { planeHeight, rectanglePolygon, type HeightPlane, type PlanPoint, type RoofPatch } from "../geometry/planar-domain";
import { copingCells, plinthCells, type WallTrimInput } from "../geometry/wall-trim";
import { wallColumns, type WallSpec } from "../geometry/wall-solids";
import type { FloorInput } from "../geometry/floor-input";

export interface ScanSolid {
  /** A shared group whose internal overlaps are excluded, such as one wall or roof patch. */
  group: string;
  polygon: PlanPoint[];
  bottom: HeightPlane;
  top: HeightPlane;
}

export interface OverlapPair {
  a: string;
  b: string;
  samples: number;
  maxDepth: number;
  at: { x: number; z: number; low: number; high: number };
  bounds: { west: number; east: number; north: number; south: number };
}

export const envelopeSolids = (input: {
  walls: readonly WallSpec[]; roof: readonly RoofPatch[]; trim: WallTrimInput; floors: readonly FloorInput[];
}): ScanSolid[] => [
  ...input.walls.flatMap((wall) => wallColumns(wall, input.roof).flatMap((column) =>
    column.intervals.map((interval) => ({ group: wall.id, polygon: column.polygon, bottom: interval.bottom, top: interval.top })))),
  ...input.roof.map((patch) => ({
    group: `roof:${patch.owner}:${patch.id}`, polygon: patch.polygon,
    bottom: { ...patch.height, constant: patch.height.constant - patch.thickness }, top: patch.height,
  })),
  ...copingCells(input.trim).map((cell) => ({ group: "trim:coping", polygon: rectanglePolygon(cell.rect), bottom: cell.bottom, top: cell.top })),
  ...plinthCells(input.trim).map((cell) => ({ group: "trim:plinth", polygon: rectanglePolygon(cell.rect), bottom: cell.bottom, top: cell.top })),
  ...input.floors.flatMap((floor) => floor.slabs.map((slab) => ({
    group: `floor:${floor.space}`, polygon: rectanglePolygon(slab),
    bottom: { x: 0, z: 0, constant: slab.bottom }, top: { x: 0, z: 0, constant: slab.floor },
  }))),
];

const strictlyInside = (polygon: readonly PlanPoint[], p: PlanPoint, margin: number): boolean => polygon.every((a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  return ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) / length > margin;
});

/** Sample count: grid points inspected by the last scanOverlaps call. */
export const lastScan = { samples: 0 };

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

/** Finds solids containing a point in plan and between bottom and top, for observation-position checks. */
export const solidsContaining = (solids: readonly ScanSolid[], at: { x: number; y: number; z: number }): string[] =>
  solids.filter((solid) => strictlyInside(solid.polygon, at, 1e-4) &&
    at.y > planeHeight(solid.bottom, at) + 1e-4 && at.y < planeHeight(solid.top, at) - 1e-4).map((solid) => solid.group);
