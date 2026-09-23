import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Attach a numerical gathering point to the current scalp without storing a
 * personal vertex or guide. The source growth domain supplies neutral triangles
 * around an interior origin, and polar/azimuth are radians from +Y and around
 * +Y from +Z toward +X. A ray selects the closest positive domain hit. Its
 * barycentric coefficients are then evaluated on the same triangle of the
 * current face, so shape edits carry the tie with that scalp tissue.
 *
 * The common domain must contain an outward-facing ray hit in the requested
 * direction. Its topology, indices and current vertex correspondence were
 * admitted by the basis builder. No hit refuses instead of snapping to a
 * different piece of scalp. This function selects one point; it never authors
 * or caches a strand path. Changes to the source geometry invalidate the
 * resolved triangle and therefore the basis revision.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Keeps a shared numerical tie attached to source geometry under every identity edit.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Resolves a polar styling input to a current barycentric scalp point without a stored personal guide.
 */
export function resolveHumanFaceHairGatherAnchor(props: {
  origin: IAutoMovieVector3;
  positions: readonly number[];
  current: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  polar: number;
  azimuth: number;
}): {
  point: IAutoMovieVector3;
  triangle: number;
  weights: [number, number, number];
} {
  const direction = Vector3.create(
    Math.sin(props.polar) * Math.sin(props.azimuth),
    Math.cos(props.polar),
    Math.sin(props.polar) * Math.cos(props.azimuth),
  );
  const at = (source: readonly number[], id: number): IAutoMovieVector3 =>
    Vector3.create(source[3 * id], source[3 * id + 1], source[3 * id + 2]);
  let nearest = Infinity;
  let chosen = -1;
  let barycentric: [number, number, number] = [0, 0, 0];
  for (const triangle of props.triangles) {
    const ids = props.indices.slice(3 * triangle, 3 * triangle + 3);
    const a = at(props.positions, ids[0]);
    const ab = Vector3.subtract(at(props.positions, ids[1]), a);
    const ac = Vector3.subtract(at(props.positions, ids[2]), a);
    const cross = Vector3.cross(direction, ac);
    const determinant = Vector3.dot(ab, cross);
    const roundoff = Number.EPSILON * Vector3.length(ab) * Vector3.length(ac);
    if (Math.abs(determinant) <= roundoff) continue;
    const relative = Vector3.subtract(props.origin, a);
    const u = Vector3.dot(relative, cross) / determinant;
    const perpendicular = Vector3.cross(relative, ab);
    const v = Vector3.dot(direction, perpendicular) / determinant;
    const t = Vector3.dot(ac, perpendicular) / determinant;
    const boundary = 32 * Number.EPSILON;
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
      const clippedU = Math.max(0, u);
      const clippedV = Math.max(0, v);
      const sum = Math.max(1, clippedU + clippedV);
      barycentric = [
        1 - (clippedU + clippedV) / sum,
        clippedU / sum,
        clippedV / sum,
      ];
    }
  }
  if (chosen < 0)
    throw new Error("A hair gathering ray must meet its shared scalp domain.");
  const ids = props.indices.slice(3 * chosen, 3 * chosen + 3);
  const point = ids.reduce(
    (sum, id, corner) =>
      Vector3.add(
        sum,
        Vector3.scale(at(props.current, id), barycentric[corner]),
      ),
    Vector3.create(),
  );
  return { point, triangle: chosen, weights: barycentric };
}
