import type {
  IAutoMovieReconstructRecovery,
  IAutoMovieRecoveryDomainLedger,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "..";

/**
 * Bind declared saved-domain identities to actual returned ownership records.
 * The legacy explicit planner retains original group order and appends
 * diagnostics. Exact unique scalar brackets map its ranges to original declared
 * interval ordinals. Missing admission observations and ambiguous per-group
 * analytic ranges stay unknown. No mesh position, normal or triangle is changed
 * by this record assembly.
 */

export namespace IAutoMovieRecoveryDomainsDescriptionOperation {
  /**
   * Bind declared saved-domain identities to actual returned ownership records.
   * The legacy explicit planner retains original group order and appends
   * diagnostics. Exact unique scalar brackets map its ranges to original
   * declared interval ordinals. Missing admission observations and ambiguous
   * per-group analytic ranges stay unknown. No mesh position, normal or
   * triangle is changed by this record assembly.
   */

  export type Operation = (
    input: IAutoMovieRecoveryTensorFamiliesInput,
    result: ReturnType<IAutoMovieReconstructRecovery.Operation>,
  ) => IAutoMovieRecoveryDomainLedger;
}
