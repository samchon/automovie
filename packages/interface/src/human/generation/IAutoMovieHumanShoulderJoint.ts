import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanShoulderJoint; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanShoulderJoint {
  /** A right-handed canonical-right frame, reflected only after placement. */
  export interface IPlacement {
    /** Generated joint centre in the caller's sided calibration frame. */
    centre: AutoMovieVector3Tuple;
    /** Canonical-right AP, superior and medial axes; not measured AcrCS. */
    axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
    /** Acromion-to-GH projection along the straight downward measuring axis. */
    projection: number;
  }
}
