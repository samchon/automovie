import { IAutoMovieCameraClearanceEnvelope } from "@automovie/interface";

/** Copy an accepted envelope so the resolved scene cannot alias author input. *
 *
 * @evidence requirements/staging/scope-and-source-of-truth.md#staging-resolved-scene-state Copies admitted camera-clearance spheres so later resolved-state changes cannot mutate author input.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership Copies admitted camera-clearance spheres so later resolved-state changes cannot mutate author input.
 */
export const lowerCameraClearanceEnvelope = (
  envelope: IAutoMovieCameraClearanceEnvelope,
): IAutoMovieCameraClearanceEnvelope => ({
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
});
