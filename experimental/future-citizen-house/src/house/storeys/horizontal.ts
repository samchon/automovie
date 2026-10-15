import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { identity } from "../identity";
import type { Rect } from "../Rect";
import { stairHole } from "../stairHole";
import { subtract } from "./subtract";

const outline: Rect = [datum.minX, datum.maxX, datum.minZ, datum.maxZ];
/**
 * Add a horizontal slab over `plan` between heights `y0` and `y1`, optionally with the stair hole
 * cut out. Cutting the hole is rect subtraction on the source input, not a viewer clipping
 * approximation.
 */
export function horizontal(
  a: Assembly,
  id: string,
  space: string,
  y0: number,
  y1: number,
  material: string,
  hole: boolean,
  plan: Rect = outline
): void {
  const pieces = hole ? subtract(plan, stairHole) : [plan];
  pieces.forEach((r, i) => a.box(
    id + "-" + i,
    space,
    material,
    (r[0] + r[1]) / 2,
    (y0 + y1) / 2,
    (r[2] + r[3]) / 2,
    r[1] - r[0],
    y1 - y0,
    r[3] - r[2],
    identity,
    hole && material === "stone" ? {
      ...(Math.abs(r[0] - stairHole[1]) < 1e-7 ? { "x-": "plaster-paint" } : {}),
      ...(Math.abs(r[1] - stairHole[0]) < 1e-7 ? { "x+": "plaster-paint" } : {}),
      ...(Math.abs(r[2] - stairHole[3]) < 1e-7 ? { "z-": "plaster-paint" } : {}),
      ...(Math.abs(r[3] - stairHole[2]) < 1e-7 ? { "z+": "plaster-paint", "y+": "plaster-paint" } : {}),
    } : undefined
  )
  );
}
