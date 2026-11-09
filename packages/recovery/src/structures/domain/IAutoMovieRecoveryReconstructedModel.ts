import type { IAutoMovieRecoveryDomainLedger } from "./IAutoMovieRecoveryDomainLedger";
import type { IAutoMovieRecoveryReconstruction } from "./IAutoMovieRecoveryReconstruction";

/**
 * Reconstructed model with its independent declared-domain membership ledger.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 */
export interface IAutoMovieRecoveryReconstructedModel extends IAutoMovieRecoveryReconstruction {
  /** Declared-to-generated domain accounting, independent of numerical qualification. */
  membership: IAutoMovieRecoveryDomainLedger;
}
