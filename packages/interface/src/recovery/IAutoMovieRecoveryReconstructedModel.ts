import type {
  IAutoMovieRecoveryDomainLedger,
  IAutoMovieRecoveryReconstruction,
} from "..";

/**
 * Generated reconstruction together with a ledger of each declared domain's
 * realized membership.
 */

export interface IAutoMovieRecoveryReconstructedModel extends IAutoMovieRecoveryReconstruction {
  /**
   * Ledger relating declared saved domains to generated parts and recording any
   * missing or unattributed geometry.
   */
  membership: IAutoMovieRecoveryDomainLedger;
}
