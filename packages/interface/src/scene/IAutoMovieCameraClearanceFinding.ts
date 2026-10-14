/**
 * One carried-bound contact over an ordered camera sample interval.
 *
 * @evidence contracts/common.md#principled-implementation Clearance evaluation records the envelope part, resolved obstacle and endpoint-inclusive sample interval where conservative swept bounds contact.
 * @evidence contracts/common.md#clear-and-simple-design Four scalar identity/timing fields expose one blocked interval without copying obstacle geometry into the report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is bound intersection, not an exact collision time or penetrating mesh point; conservative continuous coverage depends on the evaluator's interpolation, obstacle-envelope and numerical premises.
 * @evidence contracts/common.md#meaningful-documentation Defines body-versus-rig ownership, stable obstacle id and inclusive shot-local second bounds.
 * @author Samchon
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
