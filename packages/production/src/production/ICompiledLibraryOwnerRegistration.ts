import type { IAutoMovieLibraryContribution, IAutoMovieEnvironmentContext } from "@automovie/interface";

/**
 * One graph-admitted library source registration and its validated contribution.
 *
 * @evidence contracts/common.md#principled-implementation Named export and exact design/H2 address bind an admitted owner edge; contribution contains a definite contexts list normalized by collection before downstream admission.
 * @evidence contracts/common.md#clear-and-simple-design collectLibrarySourceRegistrations creates records used by library evaluation and contribution admission; source identity stays beside the normalized output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not infer a design owner or claim ordinary Node evaluation was sandboxed; a type is not evidence of runtime determinism.
 * @evidence contracts/common.md#meaningful-documentation States export/address identity and definite contexts after collection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type executes no registration discovery, schema validation or normalization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result type defines no reuse proof for mutable owner modules or contexts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The build attempt owns contribution arrays and references; this declaration acquires no handle or task.
 * @author Samchon
 */
export interface ICompiledLibraryOwnerRegistration {
  /** Named export the registration was found under. */
  export: string;

  /** Exact design-document and H2 address the export registered. */
  design: string;

  /**
   * Validated contribution the export's build function returned.
   *
   * Collection supplies a definite contexts list when the authored contribution omits that optional field; downstream admission consumes this normalized record.
   */
  contribution: IAutoMovieLibraryContribution & {
    /** Normalized explicit contexts, empty when the authored contribution omitted them. */
    contexts: IAutoMovieEnvironmentContext[];
  };
}
