import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionObstacleAperture } from "./IAutoMovieMotionObstacleAperture";

/**
 * A performance obstacle described by its footprint, vertical extent and
 * optional apertures and film-time motion. Human action planning queries this
 * common scene capability.
 */
export interface IAutoMovieMotionHumanObstacle {
  /** Its subject id, which a refusal names. */
  subject: string;

  /**
   * Its footprint on the floor: a convex polygon's corners in order, world
   * metres; `y` is not read.
   */
  footprint: readonly IAutoMovieVector3[];

  /**
   * The height its solid starts at, metres above the floor: 0 for a wall, the
   * underside of a beam.
   */
  bottom: number;

  /** The height its solid ends at, metres above the floor. */
  top: number;

  /** Its openings; none when absent. */
  apertures?: readonly IAutoMovieMotionObstacleAperture[];

  /**
   * Where a moving obstacle is at a film second; `footprint` is then in its own
   * frame, placed by `HumanObstacleMotion.at`. Still when absent.
   */
  motion?: (seconds: number) => {
    /** Obstacle root position in world metres. */
    position: IAutoMovieVector3;
    /** Obstacle yaw in degrees about world +Y. */
    yaw: number;
  };
}

/** Operation-local contracts supporting IAutoMovieMotionHumanObstacle. */
export namespace IAutoMovieMotionHumanObstacle {
  /**
   * The breadth and height a body requires to pass through an opening, in
   * metres. Obstacle queries compare this input with candidate passage
   * clearance.
   */
  export interface INeed {
    /**
     * The width it takes, metres: the shoulders' breadth for a body that walks
     * facing its way.
     */
    breadth: number;

    /** The height it takes, metres: the stature for a body that stands. */
    height: number;
  }

  /** Where and why a path is blocked. */
  export interface IBlock {
    /** The obstacle. */
    subject: string;

    /**
     * Where the path first meets the obstacle's footprint, world metres on the
     * floor.
     */
    at: IAutoMovieVector3;

    /** How far along the path that is, metres from its start. */
    distance: number;

    /**
     * Why: a solid with no opening on the path, an opening narrower than the
     * body, or one lower than it.
     */
    cause: (readonly ["solid", "narrow", "headroom"])[number];

    /** The opening the path goes through, for `narrow` and `headroom`. */
    aperture?: string;

    /**
     * The measure that falls short and what it would have to be, metres, for
     * `narrow` and `headroom`.
     */
    short?: {
      /** Available geometric clearance in metres. */
      has: number;
      /** Required geometric clearance in metres. */
      needs: number;
    };
  }
}
