import type { AutoMovieArchetypeVaultingPole } from "@automovie/archetypes";
import type { AutoMovieMotionHumanPerformance } from "@automovie/motions";

/**
 * A staged pole vault (`stageVaultingPole`): the take and the pole it vaults with.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states what it is.
 * @evidence contracts/development/design.md#principled-representation The performance and the archetype the take was staged with.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, what the vault specs read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pole is the archetype itself, not a copy of its figures.
 */
export interface IStagedVault {
  /** The take. */
  film: AutoMovieMotionHumanPerformance;

  /** The pole. */
  pole: ReturnType<typeof AutoMovieArchetypeVaultingPole.create>;
}
