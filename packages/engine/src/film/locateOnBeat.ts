import {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { beatNodeOf } from "./beatNodeOf";

/**
 * Stamp beat-scoped feedback onto the screenplay graph: every violation produced while working `beatId` gains `node`, the id of the beat node that claims it, so `scriptAncestors` can cascade it up the refinement chain.
 *
 * When the tree is absent or no beat node claims `beatId`, the result is a shallow copy of the input list with no stamp. Otherwise each violation is copied with `node` set, replacing any `node` it already carried. The input list and its violations are never mutated.
 *
 * @param violations Feedback produced while working the beat.
 * @param tree The script's refinement tree, or nothing when it has none.
 * @param beatId Flat script beat id the feedback belongs to.
 * @returns A new list of the same length and order.
 *
 * @evidence contracts/common.md#principled-implementation One `beatNodeOf` lookup resolves the claiming node, then an object spread copies each violation with `node` set, which leaves the inputs untouched; it relies on `validateScriptTree` making the beat-to-node join one-to-one, so the first claimant is the only one.
 * @evidence contracts/common.md#clear-and-simple-design The beat-to-node join is `beatNodeOf`'s, shared with every beat-scoped consumer; this function only applies it to a violation list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every violation in the list is stamped the same way; an unclaimed beat yields an unstamped copy rather than a guessed node.
 * @evidence contracts/common.md#meaningful-documentation States what `node` is set to and why, the unclaimed and missing-tree result, that an existing `node` is overwritten, and that neither the list nor its entries are mutated.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the tree size for the one lookup plus linear in the violation count for the copy; the lookup runs once, not per violation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure transformation of one list that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned list and its copies.
 */
export function locateOnBeat(
  violations: readonly IAutoMovieConstraintViolation[],
  tree: readonly IAutoMovieScriptNode[] | null | undefined,
  beatId: string,
): IAutoMovieConstraintViolation[] {
  const node: string | null = beatNodeOf(tree, beatId);
  if (node === null) return [...violations];
  return violations.map(
    (
      violation: IAutoMovieConstraintViolation,
    ): IAutoMovieConstraintViolation => ({ ...violation, node }),
  );
}
