import type { IAutoMovieContractRuleMetadata } from "./IAutoMovieContractRuleMetadata";


/** One anchored H2 carrying an exact structured contract rule.
 *
 * @evidence contracts/common.md#principled-implementation Anchored H2 identity and validated routing metadata represent one selected structured contract item.
 * @evidence contracts/common.md#clear-and-simple-design One DTO keeps evidence address, file and human title beside machine routing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not assert all prose H2s carry metadata or that inactive rules execute.
 * @evidence contracts/common.md#meaningful-documentation Members state relative address, explicit anchor and validated metadata ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased anchored-rule interface acquires no retained state, handles or tasks; readAutoMovieContractRules creates the addressed records and its caller owns the returned array and metadata strings.
 *
 * @author Samchon
 */
export interface IAutoMovieContractRule {

  /** Stable evidence address relative to the parsed root. */
  address: string;

  /** Explicit H2 anchor. */
  anchor: string;

  /** Visible H2 title without its anchor. */
  heading: string;

  /** Markdown path relative to the parsed root. */
  file: string;

  /** Validated routing metadata. */
  metadata: IAutoMovieContractRuleMetadata;
}
