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
 * @evidence contracts/common.md#principled-implementation The ray from the
 *   domain origin is intersected with each neutral triangle by the
 *   Moller-Trumbore construction, whose determinant is ab . (d x ac) and whose
 *   barycentric coordinates and distance come from the same triples; the nearest
 *   positive distance wins with a lower triangle index breaking ties, and a
 *   triangle nearly parallel to the ray is skipped by a roundoff bound. The
 *   premise is an interior origin, since a hit is required, and no back-face
 *   culling is applied. The barycentric weights are then evaluated on the same
 *   triangle of the current face, so the tie moves with the scalp tissue, and
 *   they sum to one after clipping.
 * @evidence contracts/common.md#clear-and-simple-design One ray query over the
 *   domain triangles; it selects a point and stores nothing, so the builder
 *   resolves it afresh for each evaluated face.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject: no hit refuses and no snapping to another piece of scalp
 *   is attempted.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the angle convention, the choice of hit, the barycentric transfer to the
 *   current face, the refusal and the invalidation rule.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Polar is measured from
 *   +Y and azimuth around +Y from +Z toward +X, both in radians, giving the
 *   direction (sin p sin a, cos p, sin p cos a); origin and neutral positions
 *   are head-frame metres and the current positions are the same frame on the
 *   evaluated face. The one conversion is neutral hit to current point by
 *   barycentric weights.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The tie position is
 *   an authored styling choice and carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidence contracts/anatomy.md#parametric-authority The input is two named
 *   angles of a ray from the head's chart origin, and the hit triangle and its
 *   barycentric weights are derived and never given, so no input names a vertex,
 *   curve or strand.
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
