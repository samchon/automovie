import { IAutoMovieDiagnostic, IAutoMovieScreenplayIndex, IAutoMovieShotContract } from "@automovie/interface";

/**
 * Require a resident screenplay index only when shot contracts exist. Presence is sufficient here; index structure, scene citations and prose are judged by their own gates.
 *
 * @evidence contracts/common.md#principled-implementation A null-index check and contract-map size implement the residency implication. An empty but non-null index satisfies this gate, with validity left to ledger and prose admission.
 * @evidence contracts/common.md#clear-and-simple-design The review coordinator combines this residency result with separate ledger/prose diagnostics rather than mixing content decoding into a presence check.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No screenplay is invented for a fresh scaffold, and a populated shot map with null index reports the existing compile refusal without renumbering shots.
 * @evidence contracts/common.md#meaningful-documentation States the non-null presence rule, empty-contract silence, borrowed inputs and separation from index content validation.
 * @evidence contracts/performance.md#efficient-algorithms Map size and one null comparison take constant work; at most one diagnostic record and its count-bearing message are allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work This cheap check reads current map size and index presence each time because contracts may change; it retains no memoized residency result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned zero-or-one diagnostic array escapes under caller ownership. No index bytes, file handle, running task or cross-build state is retained.
 */
export const screenplayResidencyDiagnostics: (props: {
    /** Current shot population; zero contracts require no index at this gate. */
    contracts: ReadonlyMap<string, IAutoMovieShotContract>;

    /** Resident index presence; a non-null empty index satisfies this check. */
    screenplay: IAutoMovieScreenplayIndex | null;
}) => IAutoMovieDiagnostic[] = (props: {
  /** Current shot population; zero contracts require no index at this gate. */
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;

  /** Resident index presence; a non-null empty index satisfies this check. */
  screenplay: IAutoMovieScreenplayIndex | null;
}): IAutoMovieDiagnostic[] =>
  props.screenplay !== null || props.contracts.size === 0
    ? []
    : [
        {
          code: "screenplay-index-missing",
          category: "error",
          phase: "compile",
          target: "screenplay",
          path: null,
          message: `${props.contracts.size} shot contract(s) are resident with no screenplay index. Their scene citations join to numbering that does not exist, so nothing downstream can be traced to authored work. Author the screenplay index, then compile again.`,
        },
      ];
