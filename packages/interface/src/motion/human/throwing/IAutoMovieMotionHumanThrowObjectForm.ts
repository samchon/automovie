/**
 * The throw's form: every coefficient of its launch, its clock, its trunk
 * and its hand's places by style, each with its source or marked provisional
 * where no study read gives the value. Read by `throwObject`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The throw's form: every coefficient of its launch, its clock, its trunk and its hand's places by style, each with its source or marked provisional where no study read gives the value. Read by `throwObject`.
 * @evidence contracts/development/design.md#principled-representation A closed style choice selects general and sport-specific releases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/throwCases.ts (throwCases); throwing/throwObject.ts (throwObject.plan); throwing/throwObjectForm.ts (throwObjectForm.ANGLE); throwing/throwObjectForm.ts (throwObjectForm.WINDUP); throwing/throwObjectForm.ts (throwObjectForm.TURN); throwing/throwObjectForm.ts (throwObjectForm.TILT).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in throwCases.
 */
export namespace IAutoMovieMotionHumanThrowObjectForm {
  /**
   * Capture cases of the throw and catch family (#3232): performer `a` throws to performer `b` standing facing it, overarm over 6 m, underarm over 4 m and a toss over 2.5 m, aimed at the place ahead of `b` where its catch meets the path; `b` catches with two hands. How the object is thrown.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the throw and catch family (#3232): performer `a` throws to performer `b` standing facing it, overarm over 6 m, underarm over 4 m and a toss over 2.5 m, aimed at the place ahead of `b` where its catch meets the path; `b` catches with two hands. How the object is thrown.
   * @evidence contracts/development/design.md#principled-representation A closed style choice distinguishes generic delivery, rugby lateral, quarterback delivery and the gridiron snap.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/throwCases.ts (throwCases); throwing/throwObject.ts (throwObject.plan); throwing/throwObjectForm.ts (throwObjectForm.ANGLE); throwing/throwObjectForm.ts (throwObjectForm.WINDUP); throwing/throwObjectForm.ts (throwObjectForm.TURN); throwing/throwObjectForm.ts (throwObjectForm.TILT).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in throwCases.
   */
  export type Style =
    /** Release 20 degrees above the horizontal after a 0.5 s windup; a ball or stone thrown far ({@link throwObjectForm.ANGLE}, {@link throwObjectForm.WINDUP}). */
    | "overarm"
    /** 40 degrees, 0.45 s; a lob or a precision throw from below. */
    | "underarm"
    /** 50 degrees, 0.35 s; a gentle toss to a near partner. */
    | "toss"
    /** 18 degrees, 0.3 s; a rugby pass. */
    | "rugby"
    /** 17 degrees, 0.45 s; an American football pass. */
    | "gridironPass"
    /** 22 degrees, 0.24 s; an American football snap. */
    | "gridironSnap"
    /** 2 degrees, 0.64 s; a softball windmill pitch. */
    | "windmill"
    /** -4 degrees, 0.42 s; a cricket bowl, released below the horizontal. */
    | "cricket"
    /** -1 degree, 0.58 s; a ten-pin bowl along the lane. */
    | "bowling";
}
