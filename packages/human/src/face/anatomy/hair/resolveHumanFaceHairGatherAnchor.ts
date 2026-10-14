import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairGatherAnchor } from "./IHumanFaceHairGatherAnchor";
import type { IResolveHumanFaceHairGatherAnchorProps } from "./IResolveHumanFaceHairGatherAnchorProps";

/**
 * A neutral angular ray finds its nearest positive growth-domain triangle hit and carries its barycentric weights to matching current coordinates. The test is two-sided; outward-facing orientation is a source-domain premise rather than a check here. No hit refuses instead of snapping to another scalp region. Polar and azimuth are radians from +Y and around +Y from +Z toward +X; coordinate arrays remain borrowed and the result owns its current metre point and weights.
 *
 * @evidence contracts/common.md#principled-implementation The nearest positive neutral-domain ray hit supplies original barycentric weights evaluated on matching current vertices.
 * @evidence contracts/common.md#clear-and-simple-design Angular tie authoring stays independent from personal guide or vertex data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hit refuses rather than snapping elsewhere; the algorithm is two-sided and does not itself verify outward-facing triangle orientation.
 * @evidence contracts/common.md#meaningful-documentation Polar/azimuth are radians from +Y and +Z toward +X, with output coordinates in current head metres.
 * @evidence contracts/performance.md#efficient-algorithms All domain triangles are scanned once with fixed ray-triangle arithmetic and ordinal tie-breaking.
 * @evidence contracts/performance.md#reuse-equivalent-work The selected neutral triangle's weights are reused for current seating rather than current-space reidentification.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns weights and point, while all source/current coordinate arrays are borrowed during the call.
 */
export function resolveHumanFaceHairGatherAnchor(
  props: IResolveHumanFaceHairGatherAnchorProps,
): IHumanFaceHairGatherAnchor {
  const direction: IAutoMovieVector3 = Vector3.create(
    Math.sin(props.polar) * Math.sin(props.azimuth),
    Math.cos(props.polar),
    Math.sin(props.polar) * Math.cos(props.azimuth),
  );
  const at: (source: readonly number[], id: number) => IAutoMovieVector3 = (
    source: readonly number[],
    id: number,
  ): IAutoMovieVector3 =>
    Vector3.create(source[3 * id], source[3 * id + 1], source[3 * id + 2]);
  let nearest: number = Infinity;
  let chosen: number = -1;
  let barycentric: [number, number, number] = [0, 0, 0];
  for (const triangle of props.triangles) {
    const ids: number[] = props.indices.slice(3 * triangle, 3 * triangle + 3);
    const a: IAutoMovieVector3 = at(props.positions, ids[0]);
    const ab: IAutoMovieVector3 = Vector3.subtract(
      at(props.positions, ids[1]),
      a,
    );
    const ac: IAutoMovieVector3 = Vector3.subtract(
      at(props.positions, ids[2]),
      a,
    );
    const cross: IAutoMovieVector3 = Vector3.cross(direction, ac);
    const determinant: number = Vector3.dot(ab, cross);
    const roundoff: number =
      Number.EPSILON * Vector3.length(ab) * Vector3.length(ac);
    if (Math.abs(determinant) <= roundoff) continue;
    const relative: IAutoMovieVector3 = Vector3.subtract(props.origin, a);
    const u: number = Vector3.dot(relative, cross) / determinant;
    const perpendicular: IAutoMovieVector3 = Vector3.cross(relative, ab);
    const v: number = Vector3.dot(direction, perpendicular) / determinant;
    const t: number = Vector3.dot(ac, perpendicular) / determinant;
    const boundary: number = 32 * Number.EPSILON;
    if (
      u < -boundary ||
      v < -boundary ||
      u + v > 1 + boundary ||
      !(t > 0) ||
      !Number.isFinite(t) ||
      (t === nearest && triangle >= chosen)
    )
      continue;
    if (t < nearest || (t === nearest && triangle < chosen)) {
      nearest = t;
      chosen = triangle;
      const clippedU: number = Math.max(0, u);
      const clippedV: number = Math.max(0, v);
      const sum: number = Math.max(1, clippedU + clippedV);
      barycentric = [
        1 - (clippedU + clippedV) / sum,
        clippedU / sum,
        clippedV / sum,
      ];
    }
  }
  if (chosen < 0)
    throw new Error("A hair gathering ray must meet its shared scalp domain.");
  const ids: number[] = props.indices.slice(3 * chosen, 3 * chosen + 3);
  const point: IAutoMovieVector3 = ids.reduce(
    (sum: IAutoMovieVector3, id: number, corner: number): IAutoMovieVector3 =>
      Vector3.add(
        sum,
        Vector3.scale(at(props.current, id), barycentric[corner]),
      ),
    Vector3.create(),
  );
  return { point, triangle: chosen, weights: barycentric };
}
