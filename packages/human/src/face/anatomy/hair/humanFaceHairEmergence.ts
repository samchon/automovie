import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairEmergenceRequest } from "./IHumanFaceHairEmergenceRequest";

/**
 * Compute the initial direction from the current surface normal and styling field at an admitted elevation above the tangent plane. The integrator supplies either the authored elevation or a trial from `humanFaceHairEmergenceRange`; this helper selects no trial. Legacy trials can rise after a typed numerical stem refusal, which does not prove that every geometric path at the lower elevation is infeasible. A nonzero field tangent supplies azimuth.
 *
 * The tilt is toward the field's tangential part, which is where that hair is combed; a field with no tangential part leaves the hair on its normal, since there is no direction to lie down in. The caller owns what happens after emergence, including the surface contact this direction is projected by. The tangential direction is normalized before the bounded cosine weight is applied. A finite positive subnormal length therefore cannot overflow an intermediate reciprocal; the same shared vector owner supplies both norms.
 *
 * @evidence contracts/common.md#principled-implementation Surface normal plus normalized tangential styling combine by authored exit elevation into a unit initial direction.
 * @evidence contracts/common.md#clear-and-simple-design The root tangent owner remains separate from later contact and rooted-stem admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A singular tangential field returns normal in this generic helper; authored non-normal preparation rejects that missing direction earlier.
 * @evidence contracts/common.md#meaningful-documentation Degrees measure elevation from the surface and vectors use the head frame; subnormal tangents normalize through the shared vector owner.
 * @evidence contracts/performance.md#efficient-algorithms Fixed vector projections and trigonometric weights take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Guide and placed-strand preparation share the same emergence formula without a per-person cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned vector is owned and caller normal/field records remain unchanged.
 */
export function humanFaceHairEmergence(
  props: IHumanFaceHairEmergenceRequest,
): IAutoMovieVector3 {
  const normal: IAutoMovieVector3 = Vector3.normalize(props.normal);
  const tangential: IAutoMovieVector3 = Vector3.subtract(
    props.field,
    Vector3.scale(normal, Vector3.dot(props.field, normal)),
  );
  const length: number = Vector3.length(tangential);
  if (!(length > 0) || !Number.isFinite(length)) return normal;
  const angle: number = (props.degrees * Math.PI) / 180;
  return Vector3.normalize(
    Vector3.add(
      Vector3.scale(normal, Math.sin(angle)),
      Vector3.scale(Vector3.normalize(tangential), Math.cos(angle)),
    ),
  );
}
