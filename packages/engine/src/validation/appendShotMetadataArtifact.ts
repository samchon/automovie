import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { appendCameraClearanceArtifact } from "./appendCameraClearanceArtifact";
import { appendShotEventsArtifact } from "./appendShotEventsArtifact";
import { appendCameraIntentArtifact } from "./appendCameraIntentArtifact";
import { appendShotCoverageArtifact } from "./appendShotCoverageArtifact";
/**
 * Inspect present shot events, camera intent, coverage and clearance evidence.
 *
 * @evidence contracts/common.md#principled-implementation Optional fields dispatch in fixed events/intent/coverage/clearance order to their shared artifact rules; the numeric duration is used as supplied, while absent/non-number duration uses the existing Infinity inspection sentinel.
 * @evidence contracts/common.md#clear-and-simple-design One metadata join serves submitted artifacts with a camera index and stored slices without one, preserving optional legacy fields and camera-reference responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent optional fields are not invented; present malformed fields produce located findings. A clear clearance status is checked structurally, but carries no revision pair from which this adapter could independently prove geometry freshness.
 * @evidence contracts/common.md#meaningful-documentation Documents structural unknown fields, reporting root, nullable scene-camera context, optional dispatch and the limits of carried clearance evidence.
 * @evidence contracts/performance.md#efficient-algorithms Cost follows event, intent, coverage/clip and clearance/sample populations, including endpoint-inclusive clock generation and nested clip admission; finite safe interval counts still require allocatable sample plans.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical array/object/range/vector/clip and camera union owners are reused; sibling metadata shares the supplied duration and camera set without a cross-shot cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains appended violations and offending values; per-field sets/paths/sample grids are local, and no camera, event player or renderer task is acquired.
 * @author Samchon
 */
export const appendShotMetadataArtifact: (shot: { duration?: unknown; camera?: unknown; events?: unknown; cameraIntent?: unknown; coverage?: unknown; cameraClearance?: unknown; }, path: string, sceneCameras: ReadonlySet<string> | null, violations: IAutoMovieConstraintViolation[]) => void = (
  /**
   * Structural, not `IAutoMovieShot`, so both callers pass their own value
   * without a cast: the submitted artifact arrives already narrowed to a
   * record, the stored slice arrives as the typed shot.
   */
  shot: {
    duration?: unknown;
    camera?: unknown;
    events?: unknown;
    cameraIntent?: unknown;
    coverage?: unknown;
    cameraClearance?: unknown;
  },
  path: string,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const duration: number = typeof shot.duration === "number" ? shot.duration : Infinity;
  if (shot.events !== undefined)
    appendShotEventsArtifact(
      shot.events,
      `${path}.events`,
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
