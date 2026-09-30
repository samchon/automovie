import { Vector3 } from "@automovie/engine";

/**
 * The recorded camera's first two rows define its image plane. Their normalized
 * cross product is the direction on which a displacement preserves both image
 * coordinates. Keeping the measured rows avoids calling a rounded third row
 * exactly orthogonal when it is only approximately so. All vectors are unitless.
 *
 * @evidence contracts/common.md#principled-implementation The unit cross product of two independent image-plane rows is orthogonal to both, so it is the direction along which a displacement preserves both image coordinates; a degenerate (parallel or zero) pair gives a zero cross product and refuses.
 * @evidence contracts/common.md#clear-and-simple-design One derivation from the recorded rows; no rounded third row is trusted.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; the ray follows the supplied rows only.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the measured rows are used and that the vectors are unitless.
 * @evidence contracts/modeling.md#spatial-conventions The rows are unitless direction vectors in the camera's recorded frame; the result is a unit vector in that frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal projection frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export function portraitNasalViewRay(
  horizontal: readonly number[],
  vertical: readonly number[],
): number[] {
  if (
    [horizontal, vertical].some(
      (v) => v.length !== 3 || !v.every(Number.isFinite),
    )
  )
    throw new Error(
      "A nasal projection frame needs finite three-component rows.",
    );
  const ray = Vector3.normalize(
    Vector3.cross(
      Vector3.normalize(
        Vector3.create(...(horizontal as [number, number, number])),
      ),
      Vector3.normalize(
        Vector3.create(...(vertical as [number, number, number])),
      ),
    ),
  );
  if (Vector3.length(ray) === 0)
    throw new Error("A nasal projection frame needs independent image axes.");
  return [ray.x, ray.y, ray.z];
}
