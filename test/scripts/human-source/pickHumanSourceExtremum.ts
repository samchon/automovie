import { humanSourcePositionTolerance } from "./humanSourcePositionTolerance.ts";
import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";

/**
 * Pick the vertex with the largest (`max`) or smallest (`min`) value of one
 * neutral coordinate (0 x, 1 y, 2 z) among candidates. Two candidates within
 * the storage tolerance of the extremum leave the landmark undetermined, and
 * the landmark is refused by name rather than resolved by choosing one.
 */
export function pickHumanSourceExtremum(
  name: string,
  positions: readonly number[],
  vertices: readonly number[],
  axis: 0 | 1 | 2,
  sense: "max" | "min",
): IHumanSourceLandmarkPick {
  if (vertices.length === 0)
    throw new Error(`Head landmark ${name}: no candidate vertex.`);
  const sign = sense === "max" ? 1 : -1;
  const candidates = vertices
    .map((vertex) => ({
      vertex,
      position: [0, 1, 2].map((c) => positions[3 * vertex + c]),
      value: positions[3 * vertex + axis],
    }))
    .sort((a, b) => sign * (b.value - a.value) || a.vertex - b.vertex);
  if (
    candidates.length > 1 &&
    Math.abs(candidates[0].value - candidates[1].value) <=
      humanSourcePositionTolerance
  )
    throw new Error(
      `Head landmark ${name}: vertices ${candidates[0].vertex} and ${candidates[1].vertex} tie at the extremum.`,
    );
  return { vertex: candidates[0].vertex, candidates };
}
