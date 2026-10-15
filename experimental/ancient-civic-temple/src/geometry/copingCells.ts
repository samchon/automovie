import type { PlanPoint } from "./PlanPoint";
import type { PlanRectangle } from "./PlanRectangle";
import { WallTrimInput } from "./WallTrimInput";
import { gridCells } from "./gridCells";
import { TrimCell } from "./TrimCell";
import { Tagged } from "./Tagged";
import { wallColumns } from "./wallColumns";

const bbox = (polygon: readonly PlanPoint[]): PlanRectangle => ({
  west: Math.min(...polygon.map((p) => p.x)), east: Math.max(...polygon.map((p) => p.x)),
  north: Math.min(...polygon.map((p) => p.z)), south: Math.max(...polygon.map((p) => p.z)),
});
const containsPoint = (polygon: readonly PlanPoint[], p: PlanPoint): boolean => polygon.every((a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x) >= -1e-9;
});
/**
 * Derives the stone coping on top of the outer walls and the stone plinth band at their foot from the wall columns.
 * The coping sits on the plane of each flat-topped column (parapet, yard wall) by its thickness and projects at
 * both long faces and free ends. An end that continues into a higher wall does not project, and cells whose
 * projection would enter another wall column are dropped. The plinth projects only in front of outer faces on
 * the building outline that run unbroken from the foot to the plinth top, and its top follows the ground height
 * the caller gives. Both results are unions of grid cells, so no solids overlap inside one part, and the shared
 * faces of touching cells are removed by culling.
 *
 * Coping: for every column with a coping thickness on a flat top, the bounding rectangle of that plane is
 * the core. Adjacent columns at the same height are joined by union, and the coping projects along the length
 * only at the ends of the wall plane (corners and free ends).
 */
export const copingCells = (input: WallTrimInput): TrimCell[] => {
  const { walls, roof, profile } = input;
  const e = profile.copingProjection;
  const byHeight = new Map<number, Tagged[]>();
  const blockers: PlanPoint[][] = [];
  const beds: Array<{ polygon: PlanPoint[]; surface: string; height: number; }> = [];
  for (const wall of walls) {
    const along = (p: PlanPoint) => wall.axis === "x" ? p.x : p.z;
    const coordinates = wall.plan.map(along);
    const [min, max] = [Math.min(...coordinates), Math.max(...coordinates)];
    for (const column of wallColumns(wall, roof)) {
      const top = column.segment.top;
      if (top.kind !== "flat" || top.coping === undefined) {
        blockers.push(column.polygon);
        continue;
      }
      const r = bbox(column.polygon);
      const [lo, hi] = wall.axis === "x" ? [r.west, r.east] : [r.north, r.south];
      const endLow = Math.abs(lo - min) < 1e-9 ? e : 0;
      const endHigh = Math.abs(hi - max) < 1e-9 ? e : 0;
      const grown = wall.axis === "x"
        ? { west: r.west - endLow, east: r.east + endHigh, north: r.north - e, south: r.south + e }
        : { west: r.west - e, east: r.east + e, north: r.north - endLow, south: r.south + endHigh };
      const list = byHeight.get(top.height) ?? [];
      list.push({ rect: r, surface: top.surface, owner: wall.owner, core: true });
      list.push({ rect: grown, surface: top.surface, owner: wall.owner, core: false });
      byHeight.set(top.height, list);
      beds.push({ polygon: column.polygon, surface: `surface.${wall.owner}.joint`, height: top.height - top.coping });
    }
  }
  const result: TrimCell[] = [];
  for (const [height, tags] of byHeight) {
    const thickness = walls.flatMap((w) => w.segments).find((s) => s.top.kind === "flat" && s.top.height === height && s.top.coping !== undefined);
    const t = thickness?.top.kind === "flat" ? thickness.top.coping ?? 0 : 0;
    const others = beds.filter((b) => Math.abs(b.height - (height - t)) > 1e-9).map((b) => b.polygon);
    const cells = gridCells(tags, (center) => [...blockers, ...others].some((polygon) => containsPoint(polygon, center)));
    for (const { rect, tag } of cells) {
      const center = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
      result.push({
        rect, bottom: { x: 0, z: 0, constant: height - t }, top: { x: 0, z: 0, constant: height },
        surface: tag.surface, owner: tag.owner,
        onBed: beds.some((b) => b.height === height - t && containsPoint(b.polygon, center)),
      });
    }
  }
  return result;
};
