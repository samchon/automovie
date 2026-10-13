import {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { beatNodeOf } from "./beatNodeOf";

/**
 * Stamp beat-scoped feedback onto the screenplay graph: every violation
 * produced while working `beatId` gains `node` = the claiming beat node's id,
 * so `scriptAncestors` can cascade it up the refinement chain.
 *
 * Pure: when the tree is absent or no node claims the beat, the input array is
 * returned as-is (no stamp, nothing mutated); when a claim exists, a new array
 * of stamped copies is returned and the originals stay untouched.
 */
export const locateOnBeat = (
  violations: readonly IAutoMovieConstraintViolation[],
  tree: readonly IAutoMovieScriptNode[] | null | undefined,
  beatId: string,
): IAutoMovieConstraintViolation[] => {
  const node = beatNodeOf(tree, beatId);
  if (node === null) return [...violations];
  return violations.map((violation) => ({ ...violation, node }));
};
