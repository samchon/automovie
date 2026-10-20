import type { IAutoMovieRecoveryDomainLedger } from "./IAutoMovieRecoveryDomainLedger";
import type { IAutoMovieRecoveryReconstruction } from "./IAutoMovieRecoveryReconstruction";

/**
 * Reconstructed model with its independent declared-domain membership ledger.
 *
 * @evidence contracts/common.md#principled-implementation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/common.md#clear-and-simple-design This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned records and arrays; the type acquires no resources.
 */
export interface IAutoMovieRecoveryReconstructedModel extends IAutoMovieRecoveryReconstruction {
  /** Declared-to-generated domain accounting, independent of numerical qualification. */
  membership: IAutoMovieRecoveryDomainLedger;
}
