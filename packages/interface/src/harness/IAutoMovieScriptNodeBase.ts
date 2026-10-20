/**
 * Fields every screenplay tree node shares: its id, the refinement edge to its parent, and the two cross edges.
 *
 * `validateScriptTree` requires non-blank unique ids, exactly one root, which must be the intent, parents that resolve without a cycle and whose kind the child's kind may refine, and temporal and interaction edges that resolve to another node. Only the refinement edge has consumers: the screenplay, the caption sidecar and `scriptAncestors` walk it. The temporal and interaction edges are checked for resolution and read by nothing else.
 *
 * @evidence contracts/common.md#principled-implementation A parent-pointer tree and id cross references share the validator's first-declaration index; iterative path coloring refuses refinement cycles. Admitted parents lead to the intent root, while temporal/interaction edges are checked only for existence and non-self references, not cycles or chronology.
 * @evidence contracts/common.md#clear-and-simple-design The shared fields live once here and each node kind adds only its `kind` and payload, so the validator and the walkers read the edges without per-kind code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self cross references refuse, while repeated interaction ids and cross-edge cycles are not rejected or given runtime meaning. The low-level graph validator assumes declared record/array shapes and can skip sparse forEach slots or throw on malformed nested values; project shape admission remains a separate boundary, and prose meaning is not graded.
 * @evidence contracts/common.md#meaningful-documentation States every validator rule on the shared fields, which edge has consumers and who they are, and that the cross edges are only checked; members give each edge's direction and what `null` means.
 */
export interface IAutoMovieScriptNodeBase {
  /** Non-blank id, unique across the whole tree. */
  id: string;

  /**
   * Id of the node this one makes concrete, or `null` for the single intent root. Feedback on a beat walks this chain upward, so a correction can target the beat, a scene, an act or the intent.
   */
  parent: string | null;

  /**
   * Id of the node this one follows on the timeline, such as the previous beat, or `null` when nothing precedes it. It must name another node.
   */
  temporal: string | null;

  /**
   * Ids of the nodes this one plays against, such as the opponent's beat in a duel. Each must name another node.
   */
  interactsWith: string[];
}
