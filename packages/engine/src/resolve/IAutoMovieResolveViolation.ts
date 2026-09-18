import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";
import { channelKey } from "./channelKey";

/**
 * A clamp that fired this frame, tagged with the channel it constrained.
 *
 * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Attaches source identity to one applied constraint.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Defines a source-addressed constraint finding in the resolved-frame receipt.
 * @author Samchon
 */
export interface IAutoMovieResolveViolation extends IAutoMovieClampViolation {
  /**
   * The {@link channelKey} of the channel that was clamped.
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Identifies the exact sampled channel altered by the constraint pass.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Locates the constraint finding in the resolved channel set.
   */
  channel: string;

  /**
   * Id of the profile whose bound limit fired, when the limit arrived through
   * {@link IAutoMovieResolveInput.profiles}; absent for a directly-passed limit.
   * Lets a correction round say "the door profile's hinge range did this"
   * instead of pointing at an anonymous bound.
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Preserves the profile provenance of a bound that changed resolved state.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Carries constraint-source identity in the frame evaluation receipt.
   */
  profile?: string;
}
