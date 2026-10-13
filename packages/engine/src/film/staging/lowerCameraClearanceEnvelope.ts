import { IAutoMovieCameraClearanceEnvelope } from "@automovie/interface";

/**
 * Copy an accepted envelope so the resolved scene cannot alias author input. *
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
