import type { IBodyContactPlane } from "./IBodyContactPlane";

/** Signed distance of a vertex from a plane, positive on the normal's side. */
export function depthOfPlane(
  plane: IBodyContactPlane,
  positions: number[],
  vertex: number,
): number {
  return [0, 1, 2].reduce(
    (total, k) =>
      total + (positions[vertex * 3 + k] - plane.point[k]) * plane.normal[k],
    0,
  );
}
