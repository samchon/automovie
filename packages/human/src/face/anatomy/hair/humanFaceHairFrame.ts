import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Direction admission and transverse frame convention shared by numerical curl,
 * contact and ribbon transport. A zero or nonfinite desired direction refuses.
 * Given a unit tangent, an independent reference normal chooses the transverse
 * orientation. Parallel reference/tangent vectors use the least-aligned axis
 * for numerical conditioning; this chooses a frame, never a growth direction.
 * Engine vector arithmetic owns normalization. Inputs remain unchanged and all
 * outputs are fresh dimensionless vectors in the caller's common head frame.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Keeps field/frame evaluation independent of a person's identity.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Gives curl and generated strips the same nondegenerate transverse convention.
 */
export const humanFaceHairFrame = {
  direction(value: IAutoMovieVector3): IAutoMovieVector3 {
    if (
      ![value.x, value.y, value.z].every(Number.isFinite) ||
      Vector3.length(value) === 0
    )
      throw new Error(
        "The numerical hair field has no finite nonzero direction.",
      );
    return Vector3.normalize(value);
  },
  perpendicular(
    axis: IAutoMovieVector3,
    reference: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    let across = Vector3.cross(reference, axis);
    if (Vector3.length(across) <= 64 * Number.EPSILON) {
      const magnitudes = [Math.abs(axis.x), Math.abs(axis.y), Math.abs(axis.z)];
      const index = magnitudes.indexOf(Math.min(...magnitudes));
      const guide = [0, 0, 0];
      guide[index] = 1;
      across = Vector3.cross(
        Vector3.create(guide[0], guide[1], guide[2]),
        axis,
      );
    }
    return humanFaceHairFrame.direction(across);
  },
};
