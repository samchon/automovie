import { HUMAN_SOURCE_REPORTED_ENDPOINTS } from "./HUMAN_SOURCE_REPORTED_ENDPOINTS.ts";
import type { IHumanSourceBoundPart } from "./structures/IHumanSourceBoundPart.ts";

/**
 * Measure, per reported body endpoint, the largest motion of a part vertex
 * relative to its nearest skin point, metres. It is zero for a surface
 * binding by construction and the skin's own deformation around a rigid part
 * otherwise.
 */
export function measureHumanSourcePartMotion(
  bound: IHumanSourceBoundPart,
  partRow: (name: string, v: number) => number[],
  pointRow: (
    name: string,
    triangle: number,
    weights: readonly number[],
  ) => number[],
): Record<string, number> {
  const sizes: Record<string, number> = {};
  for (const name of HUMAN_SOURCE_REPORTED_ENDPOINTS) {
    let worst = 0;
    for (let v = 0; v < bound.count; v++) {
      const skinPoint = pointRow(
        name,
        bound.triangles[v],
        bound.weights.slice(3 * v, 3 * v + 3),
      );
      worst = Math.max(
        worst,
        Math.hypot(...partRow(name, v).map((x, c) => x - skinPoint[c])),
      );
    }
    sizes[name] = worst;
  }
  return sizes;
}
