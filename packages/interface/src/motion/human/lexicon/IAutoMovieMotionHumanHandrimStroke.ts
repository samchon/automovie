/**
 * One bilateral push and recovery performed by a rider already seated on
 * a moving manual wheelchair. The prop supplies the rim material-point
 * reader and owns its course throughout the stroke.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the chair, both rims, and all three positive phases in seconds.
 * @evidence contracts/development/design.md#principled-representation Three durations determine a single contact window on the same clock as the chair's authored course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanHandrimStroke consumes these parameters as a registered action and HumanObject.prop binds the moving point frames separately.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop supplies wheel geometry and travel. The parameter record neither drives wheels nor encodes body geometry.
 */
export interface IAutoMovieMotionHumanHandrimStroke {
  /** Subject id of the manual wheelchair. */
  on: string;

  /** Left and right wheel affordance ids, with a moving rim point supplied for each. */
  rims: { left: string; right: string };

  /** Seconds from the seated entry to the catch. Positive and finite. */
  approach: number;

  /** Seconds from catch to release. Positive and finite. */
  push: number;

  /** Seconds from release to the seated arm pose. Positive and finite. */
  recovery: number;
}
