import { IAutoMovieCameraClearanceEnvelope } from "@automovie/interface";

/**
 * Copy an accepted camera-clearance envelope onto the resolved scene camera.
 *
 * The body sphere and the optional parent-rig sphere keep their centres in metres and radii in metres; `null` stays `null`. The copy is deep, so a caller that later mutates the staging write cannot change the composed scene. Precondition: `validateCameraClearanceEnvelope` accepted it.
 *
 * @param envelope The validated staging envelope.
 * @returns A fresh envelope with the same spheres.
 *
 * @evidence contracts/common.md#principled-implementation A field-by-field structural copy of the two spheres, which preserves every value exactly and breaks aliasing with author input; validation is a separate, earlier step.
 * @evidence contracts/common.md#clear-and-simple-design One lowering paired with one validator, so `stageScene` composes the camera without knowing the envelope's shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No radius or centre is adjusted, defaulted or clamped; the envelope reaches the scene exactly as accepted.
 * @evidence contracts/common.md#meaningful-documentation States what is copied, the units, the `null` rig case, why the copy is deep, and the validator precondition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Copies two spheres in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work `stageScene` lowers each accepted camera's envelope once while composing, and nothing is shared between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates the returned envelope with at most two spheres and two centres, owned by the scene camera, and retains nothing.
 */
export function lowerCameraClearanceEnvelope(
  envelope: IAutoMovieCameraClearanceEnvelope,
): IAutoMovieCameraClearanceEnvelope {
  return {
    body: {
      center: { ...envelope.body.center },
      radius: envelope.body.radius,
    },
    parentRig:
      envelope.parentRig === null
        ? null
        : {
            center: { ...envelope.parentRig.center },
            radius: envelope.parentRig.radius,
          },
  };
}
