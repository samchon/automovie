import type {
  IAutoMovieRecoveryDomainLedger,
  IAutoMovieRecoveryReconstruction,
} from "..";

/** Reconstructed model with its independent declared-domain membership ledger. */

export interface IAutoMovieRecoveryReconstructedModel extends IAutoMovieRecoveryReconstruction {
  /**
   * Declared-to-generated domain accounting, independent of numerical
   * qualification.
   */
  membership: IAutoMovieRecoveryDomainLedger;
}
