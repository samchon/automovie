import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandConstruction } from "./hand/IAutoMovieHumanHandConstruction";
import type { IAutoMovieHumanHandMeasures } from "./hand/IAutoMovieHumanHandMeasures";


/** Type contracts exchanged by AutoMovieHumanArmConstruction; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmConstruction {

  /** What an arm reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What an arm reads.
   * @evidence contracts/development/design.md#principled-representation `upper`: Upper arm length. `lower`: Lower arm length. `bicep`: Biceps tape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmConstruction.add, AutoMovieHumanArmConstruction.bones, AutoMovieHumanArmConstruction.limb.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `upper`, `lower`, `bicep`, `elbow`, `forearm`, `wrist`, `circumference`, `sex`, `left`, `right`, `scale`; callers supply the complete record.
   */
  export interface IInputs {
    /** Upper arm length. */
    upper: number;

    /** Lower arm length. */
    lower: number;

    /** Biceps tape. */
    bicep: number;

    /** Elbow tape. */
    elbow: number;

    /** Forearm tape. */
    forearm: number;

    /** Wrist tape. */
    wrist: number;

    /** Hand tape. */
    circumference: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Left hand. */
    left: IAutoMovieHumanHandMeasures;

    /** Right hand. */
    right: IAutoMovieHumanHandMeasures;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * One side's bone landmarks by the arm's law, in world millimetres, before
   * any arm skin exists: what a skeleton stands its arm and hand on.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One side's bone landmarks by the arm's law, in world millimetres, before any arm skin exists: what a skeleton stands its arm and hand on.
   * @evidence contracts/development/design.md#principled-representation `elbow`: The elbow centre. `crease`: Centre of the hand's section at the wrist crease. `length`: Hand length the hand was made to, from the crease.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmConstruction.bones. Also types AutoMovieHumanArmConstruction.landmarks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `elbow`, `crease`, `length`, `thumb`, `digits`; callers supply the complete record.
   */
  export interface IBones {
    /** The elbow centre. */
    elbow: AutoMovieVector3Tuple;

    /**
     * Centre of the hand's section at the wrist crease. Hand length runs from
     * the crease, and the hand's origin-to-tip measure is `lengthRatio` of it,
     * so the crease lies the rest of that length behind the origin.
     */
    crease: AutoMovieVector3Tuple;

    /** Hand length the hand was made to, from the crease. */
    length: number;

    /** The thumb's carpometacarpal and metacarpophalangeal joints. */
    thumb: {
      /** Thumb carpometacarpal joint centre in the body's registered frame, millimetres. */
      cmc: AutoMovieVector3Tuple;
      /** Thumb metacarpophalangeal joint centre in the body's registered frame, millimetres. */
      mcp: AutoMovieVector3Tuple;
    };

    /** Each digit's centre line from its web to its tip, thumb first. */
    digits: IAutoMovieHumanHandConstruction.ILine[];
  }
}
