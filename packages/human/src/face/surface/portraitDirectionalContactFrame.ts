import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The right-handed frame of a directional contact: `forward` is the normalized
 * direction and `across` and `up` complete it.
 *
 * The helper axis is world Y unless the direction is nearly vertical
 * (|y| >= 0.9), where world X avoids a degenerate cross product. Refuses a
 * non-finite or zero direction and a negative or non-finite clearance. Shared
 * by the directional intersection, contact and surface-target constructors.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Resolves an attachment to its actual resident surface while retaining the original observation projection.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Intersects the foremost triangle in one orthonormal directional frame without first translating the query origin.
 * @author Samchon
 */
export function portraitDirectionalContactFrame(direction: IAutoMovieVector3, clearance: number) {
  if (
    ![direction.x, direction.y, direction.z, clearance].every(
      Number.isFinite,
    ) ||
    clearance < 0 ||
    Vector3.length(direction) === 0
  )
    throw new Error(
      "Directional contact needs a finite nonzero direction and nonnegative clearance.",
    );
  const forward = Vector3.normalize(direction);
  const guide =
    Math.abs(forward.y) < 0.9
      ? Vector3.create(0, 1, 0)
      : Vector3.create(1, 0, 0);
  const across = Vector3.normalize(Vector3.cross(guide, forward));
  const up = Vector3.cross(forward, across);
  return { forward, across, up };
}
