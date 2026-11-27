import type { IAutoMovieRenderViewerSubjectLens } from "./IAutoMovieRenderViewerSubjectLens";

/**
 * Inspection eye and target in world metres, with perspective lens and positive
 * ordered clip distances. Pose application currently requires an unparented
 * camera or an identity parent transform.
 */
export interface IAutoMovieRenderViewerSubjectPose {
  /** World position of the eye, in metres. */
  position: { x: number; y: number; z: number };

  /** World point the eye looks at, in metres. */
  target: { x: number; y: number; z: number };

  /** Lens this pose was resolved for. */
  lens: IAutoMovieRenderViewerSubjectLens;

  /** Near clip distance, in metres. */
  near: number;

  /** Far clip distance, in metres. */
  far: number;
}
