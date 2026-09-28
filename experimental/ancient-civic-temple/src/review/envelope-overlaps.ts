/**
 * 요청 전 자가검사: 외피 실체(벽 기둥 구간·지붕 slab·코핑·기단·바닥 slab)의
 * 양의 체적 겹침을 평면 격자로 전수 스캔한다. 각 격자점에서 그 점을 평면
 * 안쪽에 품은 실체들의 연직 구간을 모아 서로 다른 실체 묶음 사이의 겹침
 * 깊이를 잰다. 면이 맞닿는 접촉(깊이 ≤ tolerance)은 겹침이 아니다.
 * 결과는 측정값이며 시각 판정이나 문서 통과를 뜻하지 않는다.
 */
import { planeHeight, rectanglePolygon, type HeightPlane, type PlanPoint, type RoofPatch } from "../geometry/planar-domain";
import { copingCells, plinthCells, type WallTrimInput } from "../geometry/wall-trim";
import { wallColumns, type WallSpec } from "../geometry/wall-solids";
import type { FloorInput } from "../geometry/floor-input";

export interface ScanSolid {
  /** 겹침을 세지 않는 같은 묶음(같은 벽, 같은 지붕 조각 등). */
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

/** 표본 수: 마지막 scanOverlaps 호출이 검사한 격자점 수. */
export const lastScan = { samples: 0 };

/** spacing 간격 격자점마다 서로 다른 묶음 사이의 연직 구간 겹침(깊이 > tolerance)을 모은다. */
export const scanOverlaps = (solids: readonly ScanSolid[], spacing = 0.01, tolerance = 1e-3): OverlapPair[] => {
  const xs = solids.flatMap((s) => s.polygon.map((p) => p.x));
  const zs = solids.flatMap((s) => s.polygon.map((p) => p.z));
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const boxes = solids.map((s) => ({
    west: Math.min(...s.polygon.map((p) => p.x)), east: Math.max(...s.polygon.map((p) => p.x)),
    north: Math.min(...s.polygon.map((p) => p.z)), south: Math.max(...s.polygon.map((p) => p.z)),
  }));
  // 0.5m 칸마다 그 칸에 외접 상자가 걸치는 실체만 모아 격자점마다 전체를 훑지 않는다.
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
  // 격자가 경계선 위에 떨어지지 않도록 반 칸 어긋난 표본 위치를 쓴다.
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

/** 한 점이 어떤 실체의 안쪽(평면 안, 하단·상단 사이)에 있는지. 관찰 위치 검사용. */
export const solidsContaining = (solids: readonly ScanSolid[], at: { x: number; y: number; z: number }): string[] =>
  solids.filter((solid) => strictlyInside(solid.polygon, at, 1e-4) &&
    at.y > planeHeight(solid.bottom, at) + 1e-4 && at.y < planeHeight(solid.top, at) - 1e-4).map((solid) => solid.group);
