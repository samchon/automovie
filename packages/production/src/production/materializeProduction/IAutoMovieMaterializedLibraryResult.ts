import { IAutoMovieEnvironmentContext, IAutoMovieLibraryContribution } from "@automovie/interface";

/**
 * One registered owner's validated contribution and source identity before canonical publication.
 *
 * @evidence contracts/common.md#principled-implementation Library execution records branch/owner/source/export/digest and normalizes contribution contexts to a definite array before materializeAutoMovieLibraryFiles consumes it.
 * @evidence contracts/common.md#clear-and-simple-design Executed contribution remains separate from generated file bytes/index so publication and later owner-addressed reads can inspect the actual artifact population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source identity is normalized-source metadata, not an evaluator sandbox or authenticated provenance; this type alone cannot prove validation or unique publication paths.
 * @evidence contracts/common.md#meaningful-documentation Fields identify full owner address, executed source/export, normalized digest and the already-normalized contexts obligation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; library execution/admission and canonical publication account for their full workloads.
 * @evidence contracts/performance.md#reuse-equivalent-work One execution result can feed publication and in-run review without re-executing an owner; later source changes require fresh execution/currentness authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The build borrows/retains each contribution's complete models/environments/contexts through publication; sizes follow owner output and no file/task is acquired by this type.
 *
 * @author Samchon
 */
export interface IAutoMovieMaterializedLibraryResult {
  /** Active manifest-derived design branch. */
  branch: string;

  /** Exact `docs/<document>.md#<anchor>` address the export registered. */
  owner: string;

  /** Project-relative source file whose export produced the contribution. */
  source: string;

  /** Named export inside that file. */
  export: string;

  /** Digest of the normalized source bytes that were executed. */
  sourceDigest: string;

  /**
   * Validated build contribution with contexts normalized to a definite array at registration. Publication relies on that caller admission rather than repeating it.
   */
  contribution: IAutoMovieLibraryContribution & {
    contexts: IAutoMovieEnvironmentContext[];
  };
}
