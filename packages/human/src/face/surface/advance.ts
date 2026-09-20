import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Shared by createPortraitDirectionalIntersection, createPortraitDirectionalContact, portraitDirectionalSurfaceTargets, portraitMinimumDirectionalSurfaceTargets, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Resolves an attachment to its actual resident surface while retaining the original observation projection.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Intersects the foremost triangle in one orthonormal directional frame without first translating the query origin.
 * @author Samchon
 */
export function advance(
  point: IAutoMovieVector3,
  forward: IAutoMovieVector3,
  distance: number,
): IAutoMovieVector3 {
  const result = Vector3.add(point, Vector3.scale(forward, distance));
  if (![result.x, result.y, result.z].every(Number.isFinite))
    throw new Error(
      "Directional contact exceeds its finite coordinate domain.",
    );
  return result;
}
