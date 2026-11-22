/**
 * One right-handed stopped note on a stationary staged guitar. The law
 * resolves the named rigid fret and string bars and checks the authored clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged prop, the contacts and the unit and ordering of each event.
 * @evidence contracts/development/design.md#principled-representation The prop and two affordances identify one stopped string, with an explicit clock in action-local seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The guitarNote law reads all seven fields and supplies the bimanual gesture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No copied instrument dimensions or world points enter the action parameters.
 */
export interface IAutoMovieMotionHumanGuitarNote {
  /** Subject id of the guitar, supported in its staged pose for the entire note. */
  prop: string;

  /** Fret bar id, such as `fret3`, whose run crosses the chosen string. */
  fret: string;

  /** String bar id, such as `string2`, numbered with the high E as `string1`. */
  string: string;

  /** Seconds from entry until the left index stops the string, positive. */
  stopAt: number;

  /** Seconds from entry until the right index crosses the string, after `stopAt`. */
  pluckAt: number;

  /** Seconds from entry until the left index starts to lift, after `pluckAt`. */
  releaseAt: number;

  /** Seconds from entry until both fingertips have cleared the string, after `releaseAt`. Required: the score sets it, so no natural value is defined. */
  duration: number;
}
