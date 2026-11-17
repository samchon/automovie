/**
 * Contracts used by WorkoutSupport.at.
 *
 * @evidence contracts/development/common.md#meaningful-documentation prop: Scene subject id of the exercise support prop. affordance: Affordance id on that prop used for the first contact. other: Optional second support affordance id on the same prop; omitted uses the single-contact case.
 * @evidence contracts/development/design.md#principled-representation prop: Scene subject id of the exercise support prop. affordance: Affordance id on that prop used for the first contact. other: Optional second support affordance id on the same prop; omitted uses the single-contact case.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutSupport.ts (WorkoutSupport.at, on).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in WorkoutSupport.at.
 */
export namespace IAutoMovieMotionHumanWorkoutSupport {
  /**
   * Where a prop's affordance is as the action starts. Input on of WorkoutSupport.at. The prop's subject id, the affordance's id and, for a support of two places such as a dip station's two bars, the other affordance's id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation prop: Scene subject id of the exercise support prop. affordance: Affordance id on that prop used for the first contact. other: Optional second support affordance id on the same prop; omitted uses the single-contact case.
   * @evidence contracts/development/design.md#principled-representation prop: Scene subject id of the exercise support prop. affordance: Affordance id on that prop used for the first contact. other: Optional second support affordance id on the same prop; omitted uses the single-contact case.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutSupport.ts (WorkoutSupport.at, on).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in WorkoutSupport.at.
   */
  export type IAtOn = {
    /** Scene subject id of the exercise support prop. */
    prop: string;
    /** Affordance id on that prop used for the first contact. */
    affordance: string;
    /** Optional second support affordance id on the same prop; omitted uses the single-contact case. */
    other?: string;
  };
}
