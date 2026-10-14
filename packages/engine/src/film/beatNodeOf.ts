import { IAutoMovieScriptNode } from "@automovie/interface";

/**
 * The id of the beat-kind node that claims one flat {@link IAutoMovieScript.beats} entry, or null when there is no tree or no node claims it.
 *
 * This is the join `validateScriptTree` enforces one-to-one on a committed tree, and the lookup a beat-scoped consumer such as `locateOnBeat` uses to place its feedback on the screenplay graph. On a tree that has not passed that validation, the first claiming node in tree order is returned.
 *
 * @evidence contracts/common.md#principled-implementation A linear search for the first node whose kind is `beat` and whose payload names the beat; the one-to-one join that `validateScriptTree` enforces makes the first match the only match on a committed tree.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the beat-to-node join, read by `locateOnBeat` and the tests, so no consumer restates the payload match; absent and null trees are accepted because a script may carry no tree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no beat or node; an unclaimed beat answers null instead of a guessed ancestor, and an uncommitted tree's duplicate claim resolves by the stated first-match rule.
 * @evidence contracts/common.md#meaningful-documentation States what the id identifies, both null cases, the invariant it relies on and its owner, the consumer, and the result on an unvalidated tree.
 * @evidence contracts/performance.md#efficient-algorithms Linear in tree nodes with an early return on the match; an index would cost the same pass to build for the single lookup each caller makes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure lookup over one tree that coordinates nothing across calls; a caller resolving many beats owns any index.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing; it returns an id string the tree already holds.
 */
export function beatNodeOf (
  tree: readonly IAutoMovieScriptNode[] | null | undefined,
  beatId: string,
): string | null {
  if (tree === null || tree === undefined) return null;
  for (const node of tree)
    if (node.kind === "beat" && node.payload.beat === beatId) return node.id;
  return null;
}
