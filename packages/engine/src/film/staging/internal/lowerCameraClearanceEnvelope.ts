import { IAutoMovieCameraClearanceEnvelope } from "@automovie/interface";

/*
 * Copy an accepted camera-clearance envelope onto the resolved scene camera.
 *
 * The body sphere and the optional parent-rig sphere keep their centres in
 * metres and radii in metres; `null` stays `null`. The copy is deep, so a
 * caller that later mutates the staging write cannot change the composed scene.
 * Precondition: `validateCameraClearanceEnvelope` accepted it.
 * Parameter envelope: The validated staging envelope.
 * Returns: A fresh envelope with the same spheres.
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
