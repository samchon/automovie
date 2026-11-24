import {
  type IAutoMovieAppendShotMetadataArtifact,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

import { appendCameraClearanceArtifact } from "./appendCameraClearanceArtifact";
import { appendCameraIntentArtifact } from "./appendCameraIntentArtifact";
import { appendEditorialMarkersArtifact } from "./appendEditorialMarkersArtifact";
import { appendShotCoverageArtifact } from "./appendShotCoverageArtifact";
import { appendShotEventsArtifact } from "./appendShotEventsArtifact";

/**
 * Inspect present shot events, editorial markers, camera intent, coverage and
 * clearance evidence.
 */
export const appendShotMetadataArtifact: (
  shot: IAutoMovieAppendShotMetadataArtifact.IShot,
  path: string,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  /**
   * Structural, not `IAutoMovieShot`, so both callers pass their own value
   * without a cast: the submitted artifact arrives already narrowed to a
   * record, the stored slice arrives as the typed shot.
   */
  shot: IAutoMovieAppendShotMetadataArtifact.IShot,
  path: string,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const duration: number = shot.duration;
  if (shot.events !== undefined)
    appendShotEventsArtifact(
      shot.events,
      `${path}.events`,
      duration,
      violations,
    );
  if (shot.editorialMarkers !== undefined)
    appendEditorialMarkersArtifact(
      shot.editorialMarkers,
      `${path}.editorialMarkers`,
      duration,
      violations,
    );
  if (shot.cameraIntent !== undefined)
    appendCameraIntentArtifact(
      shot.cameraIntent,
      `${path}.cameraIntent`,
      duration,
      violations,
    );
  if (shot.coverage !== undefined)
    appendShotCoverageArtifact(
      shot.coverage,
      `${path}.coverage`,
      duration,
      shot.camera,
      sceneCameras,
      violations,
    );
  if (shot.cameraClearance !== undefined)
    appendCameraClearanceArtifact(
      shot.cameraClearance,
      `${path}.cameraClearance`,
      duration,
      sceneCameras,
      violations,
    );
};
