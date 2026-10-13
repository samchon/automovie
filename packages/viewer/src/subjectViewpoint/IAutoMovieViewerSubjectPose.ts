import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";

/**
 * A camera placement: where the eye is, what it looks at, and through what.
 *
 * This is the "position and orientation in" half of pose-to-image. It carries
 * no film time and no shot id, because neither is an input to looking at a
 * thing.
 *
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
