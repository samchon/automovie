import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";

/**
 * A clamp that fired this frame, tagged with the channel it constrained.
 *
 *
 * @evidence contracts/common.md#principled-implementation Extend a component clamp violation with canonical channel identity and optional originating profile id; original actual value and bound survive independently of the clamped result.
 * @evidence contracts/common.md#clear-and-simple-design A scalar provenance row joins correction reporting to constraint application without retaining a whole profile or sampled channel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Profile attribution is present only for profile-bound limits; directly supplied limits stay unattributed rather than receiving an invented owner.
 * @evidence contracts/common.md#meaningful-documentation Members describe channelKey spelling and profile absence, while the inherited record defines component, min/max side, bound and actual value.
 * @evidence contracts/performance.md#efficient-algorithms Each violation has fixed scalar fields plus strings; aggregate population is the number of crossed components in resolveFrame.
 * @evidence contracts/performance.md#reuse-equivalent-work The frame forwards the already computed clamp cause; the record owns no re-evaluation or cross-frame cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains diagnostic rows as needed and releases them with its report; no input graph, handle or active task is held.
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
