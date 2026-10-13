import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";


/**
 * Manifest identity of one local relationship after declaration validation.
 *
 * @evidence contracts/common.md#principled-implementation Validated binding metadata becomes normalized diagnostic host and Markdown target selectors with optional obligation population.
 * @evidence contracts/common.md#clear-and-simple-design One manifest record distinguishes unit checklists from distributed obligation coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Enforced means enabled claim state rather than successful evidence or semantic review.
 * @evidence contracts/common.md#meaningful-documentation Members state selector normalization, activation and eligible-population ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased binding interface acquires nothing; projectAutoMovieLocalContractClaims creates normalized host/target selector records and its caller owns the returned records and referenced population scope.
 *
 * @author Samchon
 */
export interface IAutoMovieLocalContractProjection {

  /** Native claim's diagnostic name, or an empty string when it is unnamed. */
  claim: string;

  /** Authored branch whose declared stage and population govern this binding. */
  layer: AutoMovieProductionContractClaim["autoMovieBinding"]["layer"];

  /** Construction or final-screenplay naturalness host pass. */
  pass: AutoMovieProductionContractClaim["autoMovieBinding"]["pass"];

  /** Owning branch's current lifecycle stage, including inactive declarations. */
  stage: AutoMovieProductionContractClaim["autoMovieBinding"]["stage"];

  /** Whether the claim is not explicitly disabled, not an evidence verdict. */
  enforced: boolean;

  /** Exact pilot, complete-production, or reset scope retained from the binding. */
  populationScope: AutoMovieProductionContractClaim["autoMovieBinding"]["populationScope"];

  /** Distinguishes per-unit principles from collective obligation coverage. */
  relationship: "checklist" | "distributed-coverage";

  /**
   * Native host root, file selectors, and symbols for the accountable units. An omitted root becomes "." and an omitted symbol selector becomes [].
   */
  host: { root: string; files: readonly string[]; symbols: readonly string[] };

  /**
   * Markdown contract references. Roots and symbols use the same omitted-value normalization as the host.
   */
  targets: readonly {
    root: string;
    files: readonly string[];
    symbols: readonly string[];
  }[];

  /**
   * Complete authored H2 population eligible to fulfill the obligation. Checklist bindings answer independently through their host population.
   */
  population?: {
    root: string;
    files: readonly string[];
    symbols: readonly string[];
  };
}
