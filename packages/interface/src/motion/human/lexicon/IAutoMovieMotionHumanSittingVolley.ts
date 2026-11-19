/**
 * One seated floor shift and forearm receive for sitting volleyball, entered
 * from an established floor seat with the athlete facing the incoming play.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the travel, timing, target and supporting arm for the low receive.
 * @evidence contracts/development/design.md#principled-representation A planted palm and a court-supported pelvis give way to an independent forearm reach target on the same film clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanSittingVolley consumes this record for one floor movement and receive, while the scene supplies ball travel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The shift is expressed in metres relative to the entry heading and the receive is supplied by a world location, so no actor or court is fixed.
 */
export interface IAutoMovieMotionHumanSittingVolley {
  /** Seconds for the floor shift and receive. */
  seconds: number;

  /** Signed floor displacement in metres toward the left of entry heading. */
  lateral: number;

  /** Floor palm used to assist the shift. */
  hand: "left" | "right";

  /** World location of the intended forearm-platform midpoint, in metres. */
  target: { x: number; y: number; z: number };
}
