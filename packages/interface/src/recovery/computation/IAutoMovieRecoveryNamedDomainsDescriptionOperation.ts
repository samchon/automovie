import type { IAutoMovieReconstructRecovery, IAutoMovieRecoveryDomainLedger, IAutoMovieRecoveryTensorFamiliesInput } from "../../index";


/**
 * Bind planned named domains only to unique actual reports with the same identity. Repeated or missing names keep admission and generation unknown, even if an operator report exists at the same array ordinal. All original reports and geometry stay in the reconstruction result, including unbound observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Complete current domain-ledger members, including unsupported or omitted domains. Ownership registry binding retained domain or generated fragment identities to their declared source-free owners.
 * @evidence contracts/development/design.md#principled-representation Bind planned named domains only to unique actual reports with the same identity. Repeated or missing names keep admission and generation unknown, even if an
 * @evidence contracts/development/design.md#minimal-and-owned-surface describeRecoveryDomains, describeRecoveryNamedDomains share IAutoMovieRecoveryNamedDomainsDescriptionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Complete current domain-ledger members, including unsupported or omitted domains.
 */

export namespace IAutoMovieRecoveryNamedDomainsDescriptionOperation {
/**
 * Bind planned named domains only to unique actual reports with the same identity. Repeated or missing names keep admission and generation unknown, even if an operator report exists at the same array ordinal. All original reports and geometry stay in the reconstruction result, including unbound observations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Complete current domain-ledger members, including unsupported or omitted domains. Ownership registry binding retained domain or generated fragment identities to their declared source-free owners.
 * @evidence contracts/development/design.md#principled-representation Bind planned named domains only to unique actual reports with the same identity. Repeated or missing names keep admission and generation unknown, even if an
 * @evidence contracts/development/design.md#minimal-and-owned-surface describeRecoveryDomains, describeRecoveryNamedDomains share IAutoMovieRecoveryNamedDomainsDescriptionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Complete current domain-ledger members, including unsupported or omitted domains.
 */

export type Operation = (input: IAutoMovieRecoveryTensorFamiliesInput,
result: ReturnType<IAutoMovieReconstructRecovery.Operation>) => {
 
 /** Complete current domain-ledger members, including unsupported or omitted domains. */
members: IAutoMovieRecoveryDomainLedger["members"];
 
 /** Ownership registry binding retained domain or generated fragment identities to their declared source-free owners. */
owners: Map<string, string>;
 
 /** Observed admission failures and qualification limits in production order; an empty array adds no extra certificate. */
diagnostics: string[];
};
}

