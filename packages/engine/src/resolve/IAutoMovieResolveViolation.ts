import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";

/**
 * A clamp that fired this frame, tagged with the channel it constrained.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Extend a component clamp violation with canonical channel identity and optional originating profile id; original actual value and bound survive independently of the clamped result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A scalar provenance row joins correction reporting to constraint application without retaining a whole profile or sampled channel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Profile attribution is present only for profile-bound limits; directly supplied limits stay unattributed rather than receiving an invented owner.
 * @evidence contracts/development/common.md#meaningful-documentation Members describe channelKey spelling and profile absence, while the inherited record defines component, min/max side, bound and actual value.
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
