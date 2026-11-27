import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Placed arm landmarks, segment lengths and directions in the left calibration
 * frame.
 *
 * The interface package owns these declarations; AutoMovieHumanArmBones in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanArmBones {
  /** One side's arm landmarks, left frame. */
  export interface IBones {
    /** Glenohumeral centre. */
    shoulder: AutoMovieVector3Tuple;

    /** Elbow centre. */
    elbow: AutoMovieVector3Tuple;

    /** Radiale, the radial head's upper edge, on the forearm's axis. */
    radiale: AutoMovieVector3Tuple;

    /** Stylion, the radial styloid's tip, on the forearm's axis. */
    stylion: AutoMovieVector3Tuple;

    /** Wrist centre, {@link STYLION_WRIST} past stylion. */
    wrist: AutoMovieVector3Tuple;

    /** Unit direction of the humerus, shoulder to elbow. */
    upper: AutoMovieVector3Tuple;

    /** Unit direction of the forearm, elbow to wrist. */
    lower: AutoMovieVector3Tuple;

    /** Shoulder to elbow centre, mm. */
    humerus: number;

    /** Elbow centre to wrist centre, mm. */
    forearm: number;

    /** Acromion-radiale length the bones were placed for, mm. */
    acromionRadiale: number;
    /** Actual acromion-to-GH downward measuring projection, calibration mm. */
    acromionProjection: number;
  }
}
