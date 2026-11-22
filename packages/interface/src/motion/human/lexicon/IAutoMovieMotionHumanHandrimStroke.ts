/**
 * One single-handed or bilateral push and recovery performed by a rider already seated on
 * a moving manual wheelchair with one seat. The prop supplies the rim material-point
 * reader and owns its course throughout the stroke.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the chair, both rims, the optional active side, and all three positive phases in seconds.
 * @evidence contracts/development/design.md#principled-representation Three durations determine a single contact window on the same clock as the chair's authored course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanHandrimStroke consumes these parameters as a registered action and HumanObject.prop binds the moving point frames separately.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop supplies wheel geometry and travel. The parameter record neither drives wheels nor encodes body geometry.
 */
export interface IAutoMovieMotionHumanHandrimStroke {
  /** Subject id of the manual wheelchair. */
  on: string;

  /** Wheel affordance ids on their respective sides of the seat, each with a moving rim point. */
  rims: { left: string; right: string };

  /** Active hand when the other remains at rest. Both push when omitted. */
  hand?: "left" | "right";

  /** Seconds from the seated entry to the catch. Positive and finite. */
  approach: number;

  /** Seconds from catch to release. Positive and finite. */
  push: number;

  /** Seconds from release to the seated arm pose. Positive and finite. */
  recovery: number;
}
