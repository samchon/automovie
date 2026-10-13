import type { AutoMoviePopulationTransitionReceipt } from "./AutoMoviePopulationTransitionReceipt";
import type { IAutoMoviePopulationTransitionHost } from "./IAutoMoviePopulationTransitionHost";


/**
 * Inputs required to validate one reset against its passed pilot.
 *
 * @evidence contracts/common.md#principled-implementation The validator input binds current production kind, absolute root, accepting owner, branch stages and source hosts to one historical receipt.
 * @evidence contracts/common.md#clear-and-simple-design One request exposes all facts needed to compare a reset with its passed pilot, keeping physical reads outside the pure transition validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current stages and hosts are supplied separately from receipt data so historical claims cannot substitute for present observations.
 * @evidence contracts/common.md#meaningful-documentation Members identify the current owner, absolute root, exact reset-relevant host population and declaration-name stage map.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The transition validation request is data rather than an execution strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request names one comparison boundary and stores no result shared between reset attempts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased input schema acquires no source snapshot; the calling production-graph validator supplies current host strings and a historical receipt, and validateAutoMoviePopulationTransition retains derived identity maps only until that comparison finishes.
 *
 *
 * @author Samchon
 */
export interface IValidateAutoMoviePopulationTransitionProps {
  /** Current production shape. */
  kind: "film" | "library";

  /** Current absolute production root. */
  productionLocation: string;

  /** Current owner accepting responsibility for the reset. */
  owner: string;

  /** Receipt stored on the reset population declaration. */
  receipt: AutoMoviePopulationTransitionReceipt;

  /** Current branch stages keyed by their declaration names. */
  stages: Readonly<Record<string, string>>;

  /** Exact reset-relevant host population in the current tree. */
  hosts: readonly IAutoMoviePopulationTransitionHost[];
}
