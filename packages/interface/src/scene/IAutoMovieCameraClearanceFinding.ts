/**
 * One carried-bound contact over an ordered camera sample interval.
 *
 * @evidence contracts/development/design.md#principled-representation Clearance evaluation records the envelope part, resolved obstacle and endpoint-inclusive sample interval where conservative swept bounds contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four scalar identity/timing fields expose one blocked interval without copying obstacle geometry into the report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This is bound intersection, not an exact collision time or penetrating mesh point; conservative continuous coverage depends on the evaluator's interpolation, obstacle-envelope and numerical premises.
 * @evidence contracts/development/common.md#meaningful-documentation Defines body-versus-rig ownership, stable obstacle id and inclusive shot-local second bounds.
 */
export interface IAutoMovieCameraClearanceFinding {
  /** Camera or parent-rig envelope that contacted scene geometry. */
  part: "body" | "parent-rig";

  /** Stable scene-node identity whose current bound was contacted. */
  obstacle: string;

  /** Inclusive shot-local interval start in seconds. */
  start: number;

  /** Inclusive shot-local interval end in seconds. */
  end: number;
}
