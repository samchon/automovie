/**
 * One single-handed or bilateral push and recovery performed by a rider already
 * seated on a moving manual wheelchair with one seat. The prop supplies the rim
 * material-point reader and owns its course throughout the stroke.
 */
export interface IAutoMovieMotionHumanHandrimStroke {
  /** Subject id of the manual wheelchair. */
  on: string;

  /**
   * Wheel affordance ids on their respective sides of the seat, each with a
   * moving rim point.
   */
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
