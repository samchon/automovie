import type { IAutoMovieProductionEvidenceUnit } from "./IAutoMovieProductionEvidenceUnit";


/**
 * One flat production-local contract and every H2 item it declares.
 *
 * @evidence contracts/common.md#principled-implementation A flat project-local contract retains its path, sole H1 and complete ordered H2 inventory.
 * @evidence contracts/common.md#clear-and-simple-design Contract observation is separate from design lineage and runtime rule selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No H2 denominator is inferred from successful evidence counts or fixture answers.
 * @evidence contracts/common.md#meaningful-documentation Members state docs/contracts path and exact item ordering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased contract record acquires no state or handle; readAutoMovieProductionEvidence projects readMarkdownDocument results into path/title/H2 inventories retained by the observation caller.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionEvidenceContract {

  /** Project-relative POSIX path under `docs/contracts`. */
  path: string;

  /** The document's sole H1 title. */
  title: string;

  /** Exact H2 contract inventory in document order. */
  items: readonly IAutoMovieProductionEvidenceUnit[];
}
