import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";

/**
 * A camera placement: where the eye is, what it looks at, and through what.
 *
 * This is the "position and orientation in" half of pose-to-image. It carries
 * no film time and no shot id, because neither is an input to looking at a
 * thing.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership `IAutoMovieViewerSubjectPose` states an eye the inspection owns, unbound from authored camera, shot boundary, and playback time.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan `IAutoMovieViewerSubjectPose` types the resolved camera state one viewpoint plan entry produces.
 * @author Samchon
 */
export interface IAutoMovieViewerSubjectPose {
  /**
   * World position of the eye, in metres.
   */
  position: { x: number; y: number; z: number };

  /**
   * World point the eye looks at, in metres.
   */
  target: { x: number; y: number; z: number };

  /**
   * Lens this pose was resolved for.
   */
  lens: IAutoMovieViewerSubjectLens;

  /**
   * Near clip distance, in metres.
   */
  near: number;

  /**
   * Far clip distance, in metres.
   */
  far: number;
}
