import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanArmBones; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmBones {
  /** One side's arm landmarks, left frame.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One side's arm landmarks, left frame.
   * @evidence contracts/development/design.md#principled-representation `shoulder`: Glenohumeral centre. `elbow`: Elbow centre. `radiale`: Radiale, the radial head's upper edge, on the forearm's axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmBones.place. Read by AutoMovieHumanArmAxis.walk, AutoMovieHumanArmPieces.inputs, AutoMovieHumanArmWalk.prepare. Also types AutoMovieHumanLimbRest.original, AutoMovieHumanArmLaw.placed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `shoulder`, `elbow`, `radiale`, `stylion`, `wrist`, `upper`, `lower`, `humerus`, `forearm`, `acromionRadiale`, `acromionProjection`; callers supply the complete record.
   */
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
