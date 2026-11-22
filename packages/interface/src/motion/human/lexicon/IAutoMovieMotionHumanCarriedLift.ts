/**
 * The lift into a carry and the set-down out of it (#3349): the carried
 * body leaves the posture it was entered in for the carry's over the first
 * `lift` seconds, and over the last `setDown` seconds comes down to stand
 * where the carrier has brought it.
 *
 * Both are a blend on minimum-jerk progress between two whole postures: the
 * displayed root travels straight between them, its quaternion follows
 * the shortest rotation and the joints go with it, and the carry's own posture keeps following the carrier
 * meanwhile, so the body arrives on a carrier who walks. The carried body's
 * contact with the carrier is declared only between the two, while it
 * rests there, and the feet plant on the floor through the lift and from
 * the set-down's start, so the floor bears the body until the carrier does
 * and again before the carrier lets go (#3437).
 *
 * First pass: the body is carried through the blend by nothing that is
 * shown (the carrier's hands arrive by `bearing`'s own take-up, and no hand
 * is placed under the body while it rises); the arms that cling are blended
 * from where they hung to where their hold's goal puts them, as joint angles,
 * and take the goal itself once the lift is done; the body is set down
 * standing, whatever the carry, on the floor under where its root is
 * carried.
 *
 * @evidence contracts/development/common.md#meaningful-documentation lift: Seconds the lift into the carry takes, at the start; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. setDown: Seconds the set-down takes, at the end; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation lift: Seconds the lift into the carry takes, at the start; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. setDown: Seconds the set-down takes, at the end; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedLift.ts (HumanCarriedLift.over, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedLift.over.
 */
export namespace IAutoMovieMotionHumanCarriedLift {
  /**
   * The two phases' lengths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation lift: Seconds the lift into the carry takes, at the start; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. setDown: Seconds the set-down takes, at the end; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#principled-representation lift: Seconds the lift into the carry takes, at the start; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. setDown: Seconds the set-down takes, at the end; none when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedLift.ts (HumanCarriedLift.over, context).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedLift.over.
   */
  export interface IParams {
    /** Seconds the lift into the carry takes, at the start, at least 0; none when absent. */
    lift?: number;

    /** Seconds the set-down takes, at the end, at least 0; none when absent. */
    setDown?: number;
  }
}
