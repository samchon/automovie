import type {
  IAutoMovieReconstructRecovery,
  IAutoMovieRecoveryDomainLedger,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "..";

/**
 * Bind planned named domains only to unique actual reports with the same
 * identity. Repeated or missing names keep admission and generation unknown,
 * even if an operator report exists at the same array ordinal. All original
 * reports and geometry stay in the reconstruction result, including unbound
 * observations.
 */

export namespace IAutoMovieRecoveryNamedDomainsDescriptionOperation {
  /**
   * Bind planned named domains only to unique actual reports with the same
   * identity. Repeated or missing names keep admission and generation unknown,
   * even if an operator report exists at the same array ordinal. All original
   * reports and geometry stay in the reconstruction result, including unbound
   * observations.
   */

  export type Operation = (
    input: IAutoMovieRecoveryTensorFamiliesInput,
    result: ReturnType<IAutoMovieReconstructRecovery.Operation>,
  ) => {
    /**
     * Complete current domain-ledger members, including unsupported or omitted
     * domains.
     */
    members: IAutoMovieRecoveryDomainLedger["members"];

    /**
     * Ownership registry binding retained domain or generated fragment
     * identities to their declared source-free owners.
     */
    owners: Map<string, string>;

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];
  };
}
