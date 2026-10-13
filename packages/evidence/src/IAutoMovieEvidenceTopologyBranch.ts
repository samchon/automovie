
/**
 * One branch participating in a declared authoring foundation topology.
 *
 * @evidence contracts/common.md#principled-implementation Explicit name, activation and order identify one foundation branch.
 * @evidence contracts/common.md#clear-and-simple-design Branch facts are separate from edge and account declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal order represents only a declared coordinated stage, not an inferred dependency bypass.
 * @evidence contracts/common.md#meaningful-documentation Members state stable name, selected-population activation and authoring order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased branch shape acquires no resource; the caller owns name/activation/order inputs and inspectAutoMovieEvidenceTopology owns only the call-local indexes built from them.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceTopologyBranch {

  /** Stable branch name. */
  name: string;

  /** Whether the branch is part of the selected production. */
  active: boolean;

  /** Explicit authoring order; equal values mean one coordinated stage. */
  order: number;
}
