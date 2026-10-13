import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";

/**
 * A clamp that fired this frame, tagged with the channel it constrained.
 *
 * @author Samchon
 */
export interface IAutoMovieResolveViolation extends IAutoMovieClampViolation {
  /** The {@link channelKey} of the channel that was clamped. */
  channel: string;

  /**
   * Id of the profile whose bound limit fired, when the limit arrived through
   * {@link IAutoMovieResolveInput.profiles}; absent for a directly-passed limit.
   * Lets a correction round say "the door profile's hinge range did this"
   * instead of pointing at an anonymous bound.
   */
  profile?: string;
}
