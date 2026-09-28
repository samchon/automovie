/** Each storey owns its horizontal structure and finish. Cutting the stair hole
 * is rect subtraction on the source input, not a viewer clipping approximation.
 * Board membership is generated from metric pitch and clips at room/hole edges. */
import { buildAutoMovieWall } from "@automovie/engine";

import { Assembly, identity, v } from "../assembly";
import { type Rect, datum, rooms, stairHole } from "../plan";

export function subtract(rect: Rect, cut: Rect): Rect[] {
  const x0 = Math.max(rect[0], cut[0]),
    x1 = Math.min(rect[1], cut[1]);
  const z0 = Math.max(rect[2], cut[2]),
    z1 = Math.min(rect[3], cut[3]);
  if (x1 <= x0 || z1 <= z0) return [rect];
  return [
    [rect[0], x0, rect[2], rect[3]],
    [x1, rect[1], rect[2], rect[3]],
    [x0, x1, rect[2], z0],
    [x0, x1, z1, rect[3]],
  ]
    .filter((r) => r[1] - r[0] > 1e-7 && r[3] - r[2] > 1e-7)
    .map((r) => [r[0], r[1], r[2], r[3]]);
}
export const outline: Rect = [datum.minX, datum.maxX, datum.minZ, datum.maxZ];
/** The storey's 16 mm floor finish exists only inside room cells, so a wall
 * or junction face open to the stair hole starts at the structural top. */
export const finishDepth = 0.016;
export const slabTop = (level: 0 | 1): number =>
  datum.floors[level] - finishDepth;
/** A floor slab inside the enclosure bears to the exterior wall centreline, so
 * its edge stays buried in the facade body instead of repeating the outer face
 * that the facade owner already closes (settings/003#surface-decomposition). */
export const bearing: Rect = [
  (datum.minX - datum.innerX) / 2,
  (datum.maxX + datum.innerX) / 2,
  (datum.minZ - datum.innerZ) / 2,
  (datum.maxZ + datum.innerZ) / 2,
];
export function horizontal(
  a: Assembly,
  id: string,
  space: string,
  y0: number,
  y1: number,
  material: string,
  hole: boolean,
  plan: Rect = outline,
): void {
  const pieces = hole ? subtract(plan, stairHole) : [plan];
  pieces.forEach((r, i) =>
    a.box(
      id + "-" + i,
      space,
      material,
      (r[0] + r[1]) / 2,
      (y0 + y1) / 2,
      (r[2] + r[3]) / 2,
      r[1] - r[0],
      y1 - y0,
      r[3] - r[2],
    ),
  );
}
export function floorFinish(a: Assembly, level: 0 | 1): void {
  for (const room of rooms.filter((r) => r.level === level)) {
    const tile = ["powder-utility", "upper-bathroom", "upper-service"].includes(
      room.id,
    );
    const pitchX = tile ? 0.45 : 0.18,
      pitchZ = tile ? 0.45 : 1.8;
    const transforms: Parameters<Assembly["repeat"]>[3] = [];
    for (const [cellIndex, rect] of room.cells.entries()) {
      const nx = Math.ceil((rect[1] - rect[0]) / pitchX),
        nz = Math.ceil((rect[3] - rect[2]) / pitchZ) + 1;
      for (let x = 0; x < nx; x++)
        for (let z = 0; z < nz; z++) {
          const x0 = rect[0] + x * pitchX,
            x1 = Math.min(rect[1], x0 + pitchX);
          const start = rect[2] + z * pitchZ - (tile ? 0 : (x % 3) * 0.6);
          const z0 = Math.max(rect[2], start),
            z1 = Math.min(rect[3], start + pitchZ);
          if (z1 - z0 < 0.01) continue;
          transforms.push({
            id: cellIndex + "-" + x + "-" + z,
            translation: v(
              (x0 + x1) / 2,
              datum.floors[level] - finishDepth / 2,
              (z0 + z1) / 2,
            ),
            scale: v(x1 - x0 - 0.0015, finishDepth, z1 - z0 - 0.0015),
            rotation: identity,
          });
        }
      a.environment.surfaces.push({
        space: room.id,
        surface: {
          id: room.id + "-floor-" + cellIndex,
          kind: "floor",
          polygon: [
            v(rect[0], 0, rect[2]),
            v(rect[1], 0, rect[2]),
            v(rect[1], 0, rect[3]),
            v(rect[0], 0, rect[3]),
          ],
          height: { kind: "constant", value: datum.floors[level] },
        },
      });
    }
    a.repeat(
      room.id + "-floor-boards",
      level === 0 ? "ground-storey" : "upper-storey",
      tile ? "tile" : "oak",
      transforms,
    );
  }
}
/** A horizontal holed panel uses the same public wall kernel in a rotated frame. */
export function ceiling(a: Assembly, level: 0 | 1): void {
  const y = datum.ceilings[level];
  const mesh = buildAutoMovieWall({
    width: 2 * datum.innerX,
    height: 2 * datum.innerZ,
    depth: 0.008,
    openings:
      level === 0
        ? [
            {
              id: "stair-hole",
              x: stairHole[0] + datum.innerX,
              y: stairHole[2] + datum.innerZ,
              width: stairHole[1] - stairHole[0],
              height: stairHole[3] - stairHole[2],
            },
          ]
        : [],
  });
  a.place(
    "ceiling-" + level,
    "ceiling",
    level === 0 ? "ground-storey" : "upper-storey",
    a.model("ceiling-mesh-" + level, "plaster", { type: "mesh", mesh }),
    v(0, y + 0.004, 0),
    v(1, 1, 1),
    { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
  );
}
