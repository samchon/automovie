import {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { beatNodeOf } from "./beatNodeOf";

/*
 * Stamp beat-scoped feedback onto the screenplay graph: every violation
 * produced while working `beatId` gains `node`, the id of the beat node that
 * claims it, so `scriptAncestors` can cascade it up the refinement chain.
 *
 * When the tree is absent or no beat node claims `beatId`, the result is a
 * shallow copy of the input list with no stamp. Otherwise each violation is
 * copied with `node` set, replacing any `node` it already carried. The input
 * list and its violations are never mutated.
 * Parameter violations: Feedback produced while working the beat.
 * Parameter tree: The script's refinement tree, or nothing when it has none.
 * Parameter beatId: Flat script beat id the feedback belongs to.
 * Returns: A new list of the same length and order.
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
