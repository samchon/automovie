import { IAutoMovieConstraintViolation, IAutoMovieScriptNode } from "@automovie/interface";
import { beatNodeOf } from "./beatNodeOf";

/**
 * Stamp beat-scoped feedback onto the screenplay graph: every violation
 * produced while working `beatId` gains `node` = the claiming beat node's id,
 * so `scriptAncestors` can cascade it up the refinement chain.
 *
 * Pure: when the tree is absent or no node claims the beat, the input array is
 * returned as-is (no stamp, nothing mutated); when a claim exists, a new array
 * of stamped copies is returned and the originals stay untouched.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan locateOnBeat stamps each addressed finding with its claiming beat node so the observation stays attached to screenplay hierarchy.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary locateOnBeat realizes beat observation boundaries: Stamp beat-scoped feedback onto the screenplay graph: every violation produced while working `beatId` gains `node` = the claiming beat node's id, so `scriptAncestors` can cascade it up the refinement chain. Pure: when the tree is absent or no node claims the beat, the input array is returned as-is (no stamp, nothing mutated); when a claim exists, a new array of stamped copies is returned and the originals stay untouched.
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
