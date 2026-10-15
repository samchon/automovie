import { planeHeight } from "./planeHeight";
import type { PlanRectangle } from "./PlanRectangle";
import { wallFaces } from "./wallFaces";
import { WallTrimInput } from "./WallTrimInput";
import { gridCells } from "./gridCells";
import { TrimCell } from "./TrimCell";
import { Tagged } from "./Tagged";

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
        rect = {
          west: sign < 0 ? constX - d : constX, east: sign < 0 ? constX : constX + d,
          north: Math.min(...zs), south: Math.max(...zs)
        };
      } else if (constZ !== null && (Math.abs(constZ - o.south) < 1e-9 || Math.abs(constZ - o.north) < 1e-9)) {
        const sign = constZ > 0 ? 1 : -1;
        rect = {
          west: Math.min(...xs), east: Math.max(...xs),
          north: sign < 0 ? constZ - d : constZ, south: sign < 0 ? constZ : constZ + d
        };
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
