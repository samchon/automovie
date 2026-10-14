import type { IAutoMovieHumanPersonNormalTransportHalf } from "./IAutoMovieHumanPersonNormalTransportHalf";
import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";

/**
 * What admitting fixed source normal cells reads: the admitted source partition plan and both complementary skin halves.
 *
 * @evidence contracts/common.md#principled-implementation The previously admitted geometric partition plan and both normal-transport halves allow validation to compare their shared subdivision tree before evaluating motion.
 * @evidence contracts/common.md#clear-and-simple-design One pair groups face and body normal metadata alongside the existing partition authority, avoiding independent competing admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing transport on both halves retains the supported current-only path; the type supplies no fabricated transport for a partial pair.
 * @evidence contracts/common.md#meaningful-documentation The declaration identifies the admitted partition and the two complementary normal-transport halves.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The paired normal-cell admission operands are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the paired normal-cell admission operands; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring paired normal-cell admission operands acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportValidationProps {
  /** The admitted source partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** The face's skin half. */
  face: IAutoMovieHumanPersonNormalTransportHalf;

  /** The body's skin half. */
  body: IAutoMovieHumanPersonNormalTransportHalf;
}
