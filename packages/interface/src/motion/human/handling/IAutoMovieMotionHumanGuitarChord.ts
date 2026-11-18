/**
 * A right-handed sweep of a staged two-string guitar voicing. The left
 * index stops string 3 at fret 4 and the middle stops string 2 at fret 5.
 * The right index sweeps both adjacent strings. The law admits the clock
 * and the rigid guitar affordances before planning either arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the voicing, direction and local clock.
 * @evidence contracts/development/design.md#principled-representation A fixed voicing and one direction select two ordered crossings on the same stroke.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The guitarChord law consumes each field to resolve the instrument or a stroke phase.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No model dimensions, world points or joint angles are supplied by the author.
 */
export interface IAutoMovieMotionHumanGuitarChord {
  /** Subject id of the independently supported guitar. */
  prop: string;

  /** Down goes toward higher pitch, from string 3 to 2. Up reverses that order. */
  direction: "down" | "up";

  /** Action-local seconds to complete fretting, greater than zero. */
  stopAt: number;

  /** Action-local seconds to start the across-string sweep, after stopAt. */
  sweepStartAt: number;

  /** Action-local seconds to finish the sweep, after sweepStartAt. */
  sweepEndAt: number;

  /** Action-local seconds until the fretting fingers lift, after sweepEndAt. */
  releaseAt: number;

  /** Total action-local seconds, finite and greater than releaseAt. */
  duration: number;
}
