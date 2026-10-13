/**
 * Derives the stone coping on top of the outer walls and the stone plinth band at their foot from the wall columns.
 * The coping sits on the plane of each flat-topped column (parapet, yard wall) by its thickness and projects at
 * both long faces and free ends. An end that continues into a higher wall does not project, and cells whose
 * projection would enter another wall column are dropped. The plinth projects only in front of outer faces on
 * the building outline that run unbroken from the foot to the plinth top, and its top follows the ground height
 * the caller gives. Both results are unions of grid cells, so no solids overlap inside one part, and the shared
 * faces of touching cells are removed by culling.
 */
import { cullCoincidentVerticalFaces } from "./face-culling";
import { planeHeight, rectanglePolygon, type HeightPlane, type PlanPoint, type PlanRectangle, type RoofPatch } from "./planar-domain";
import { prismFaces } from "./prism";
import { wallColumns, wallFaces, type WallFace, type WallSpec } from "./wall-solids";

export interface WallTrimProfile {
  /** Coping projection (m) at the wall's long faces and free ends. */
  copingProjection: number;
  /** Plinth projection (m) from the outer outline faces. */
  plinthProjection: number;
  /** Height (m) of the plinth top above the ground. */
  plinthRise: number;
}

export interface WallTrimInput {
  walls: readonly WallSpec[];
  roof: readonly RoofPatch[];
  profile: WallTrimProfile;
  /** The building's outer outline. The plinth attaches only to faces on this line. */
  outline: PlanRectangle;
  /** The ground plane at a plan position (plinth top = ground + rise). */
  grade: (at: PlanPoint) => HeightPlane;
  /** Ground slope break lines (Z) that split the plinth cells. */
  gradeBreaks: readonly number[];
  /** Builds the plinth surface ID from the name of the elevation that owns the outline face. */
  plinthSurface: (outerSurface: string) => string;
}

interface Tagged { rect: PlanRectangle; surface: string; owner: string; core: boolean }

/** One cell of a grid union: the solid between bottom and top planes over a plan rectangle. */
export interface TrimCell {
  rect: PlanRectangle;
  bottom: HeightPlane;
  top: HeightPlane;
  surface: string;
  owner: string;
  /** Whether the coping cell's underside rests on the wall's bearing face and is hidden. */
  onBed: boolean;
}

const eps = 1e-7;
const inside = (r: PlanRectangle, p: PlanPoint) =>
  p.x > r.west + eps && p.x < r.east - eps && p.z > r.north + eps && p.z < r.south - eps;
const bbox = (polygon: readonly PlanPoint[]): PlanRectangle => ({
  west: Math.min(...polygon.map((p) => p.x)), east: Math.max(...polygon.map((p) => p.x)),
  north: Math.min(...polygon.map((p) => p.z)), south: Math.max(...polygon.map((p) => p.z)),
});
const containsPoint = (polygon: readonly PlanPoint[], p: PlanPoint): boolean => polygon.every((a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x) >= -1e-9;
});

/** Grid cell union: takes the surface of the first tag covering the cell centre (core first). */
const gridCells = (tags: readonly Tagged[], reject: (center: PlanPoint) => boolean) => {
  const xs = [...new Set(tags.flatMap((t) => [t.rect.west, t.rect.east]))].sort((a, b) => a - b);
  const zs = [...new Set(tags.flatMap((t) => [t.rect.north, t.rect.south]))].sort((a, b) => a - b);
  const cells: Array<{ rect: PlanRectangle; tag: Tagged }> = [];
  for (let i = 0; i + 1 < xs.length; ++i) {
    for (let j = 0; j + 1 < zs.length; ++j) {
      const rect = { west: xs[i]!, east: xs[i + 1]!, north: zs[j]!, south: zs[j + 1]! };
      if (rect.east - rect.west < 1e-6 || rect.south - rect.north < 1e-6) continue;
      const center = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
      const hits = tags.filter((t) => inside(t.rect, center));
      const tag = hits.find((t) => t.core) ?? hits[0];
      if (tag === undefined || (!tag.core && reject(center))) continue;
      cells.push({ rect, tag });
    }
  }
  return cells;
};

/**
 * Coping: for every column with a coping thickness on a flat top, the bounding rectangle of that plane is
 * the core. Adjacent columns at the same height are joined by union, and the coping projects along the length
 * only at the ends of the wall plane (corners and free ends).
 */
export const copingCells = (input: WallTrimInput): TrimCell[] => {
  const { walls, roof, profile } = input;
  const e = profile.copingProjection;
  const byHeight = new Map<number, Tagged[]>();
  const blockers: PlanPoint[][] = [];
  const beds: Array<{ polygon: PlanPoint[]; surface: string; height: number }> = [];
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

/** Faces of a coping cell. Only the underside over the bearing face is a hidden joint; the projection's underside is coping. */
export const copingFaces = (input: WallTrimInput): WallFace[] => cullCoincidentVerticalFaces(
  copingCells(input).flatMap((cell) => prismFaces(rectanglePolygon(cell.rect), cell.bottom, cell.top).map((face) => ({
    surface: face.side === "bottom" && cell.onBed ? `surface.${cell.owner}.joint` : cell.surface, corners: face.corners,
  }))),
);

/**
 * Plinth: a projecting band in front of outer faces on the outline that start at the wall bottom and continue
 * above the plinth top. A face that ends below the plinth top, such as under a threshold (below an opening), is
 * skipped so the void is not blocked. Square cells join the bands at the four outer corners. Cells split at
 * ground slope break lines so each top is planar.
 */
export const plinthCells = (input: WallTrimInput): TrimCell[] => {
  const { walls, roof, profile, outline: o } = input;
  const d = profile.plinthProjection;
  const tags: Tagged[] = [];
  const bottom = Math.min(...walls.map((w) => w.bottom));
  for (const wall of walls) {
    for (const face of wallFaces(wall, roof)) {
      if (!face.surface.endsWith(".outer")) continue;
      const xs = face.corners.map((c) => c.x);
      const zs = face.corners.map((c) => c.z);
      const ys = face.corners.map((c) => c.y);
      if (Math.abs(Math.min(...ys) - bottom) > 1e-9) continue;
      const constX = Math.max(...xs) - Math.min(...xs) < 1e-9 ? xs[0]! : null;
      const constZ = Math.max(...zs) - Math.min(...zs) < 1e-9 ? zs[0]! : null;
      let rect: PlanRectangle | null = null;
      if (constX !== null && Math.abs(Math.abs(constX) - o.east) < 1e-9) {
        const sign = Math.sign(constX);
        rect = { west: sign < 0 ? constX - d : constX, east: sign < 0 ? constX : constX + d,
          north: Math.min(...zs), south: Math.max(...zs) };
      } else if (constZ !== null && (Math.abs(constZ - o.south) < 1e-9 || Math.abs(constZ - o.north) < 1e-9)) {
        const sign = constZ > 0 ? 1 : -1;
        rect = { west: Math.min(...xs), east: Math.max(...xs),
          north: sign < 0 ? constZ - d : constZ, south: sign < 0 ? constZ : constZ + d };
      }
      if (rect === null) continue;
      // When the face's upper end (the lower of its two vertices) is below the plinth top, the front of that face is under a void.
      const topEdge = Math.min(...face.corners.filter((c) => c.y > wall.bottom + 1e-9).map((c) => c.y));
      const probe = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
      if (!(topEdge > planeHeight(input.grade(probe), probe) + profile.plinthRise + 1e-9)) continue;
      tags.push({ rect, surface: input.plinthSurface(face.surface), owner: wall.owner, core: true });
    }
  }
  const corners: Array<[number, number, number, number]> = [
    [o.west - d, o.west, o.north - d, o.north], [o.east, o.east + d, o.north - d, o.north],
    [o.west - d, o.west, o.south, o.south + d], [o.east, o.east + d, o.south, o.south + d],
  ];
  for (const [west, east, north, south] of corners) {
    const neighbour = tags.find((t) => Math.abs(t.rect.north - north) < 1e-9 && Math.abs(t.rect.south - south) < 1e-9);
    if (neighbour !== undefined) tags.push({ rect: { west, east, north, south }, surface: neighbour.surface, owner: neighbour.owner, core: true });
  }
  const zBreaks = [...input.gradeBreaks];
  const split: Tagged[] = tags.flatMap((t) => {
    const cuts = [t.rect.north, ...zBreaks.filter((z) => z > t.rect.north + 1e-9 && z < t.rect.south - 1e-9), t.rect.south];
    return cuts.slice(0, -1).map((north, i) => ({ ...t, rect: { ...t.rect, north, south: cuts[i + 1]! } }));
  });
  return gridCells(split, () => false).map(({ rect, tag }) => {
    const center = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
    const ground = input.grade(center);
    return {
      rect, bottom: { x: 0, z: 0, constant: bottom }, top: { ...ground, constant: ground.constant + profile.plinthRise },
      surface: tag.surface, owner: tag.owner, onBed: false,
    };
  });
};

/** Faces of a plinth cell. The buried underside and the back against the wall are hidden joints. */
export const plinthFaces = (input: WallTrimInput): WallFace[] => cullCoincidentVerticalFaces(
  plinthCells(input).flatMap((cell) => prismFaces(rectanglePolygon(cell.rect), cell.bottom, cell.top).map((face) => {
    const hidden = face.side === "bottom" || (face.side === "edge" && isBackFace(cell.rect, face.normal, input.outline));
    return { surface: hidden ? `surface.${cell.owner}.joint` : cell.surface, corners: face.corners };
  })),
);

/** The side faces of a plinth cell on the outline that face the wall (hidden faces touching the wall). */
const isBackFace = (rect: PlanRectangle, normal: PlanPoint, o: PlanRectangle): boolean =>
  (normal.x > 0.5 && Math.abs(rect.east - o.west) < 1e-9) || (normal.x < -0.5 && Math.abs(rect.west - o.east) < 1e-9) ||
  (normal.z > 0.5 && Math.abs(rect.south - o.north) < 1e-9) || (normal.z < -0.5 && Math.abs(rect.north - o.south) < 1e-9);
