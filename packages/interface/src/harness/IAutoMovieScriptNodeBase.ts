/**
 * Fields every screenplay tree node shares: its id, the refinement edge to its parent, and the two cross edges.
 *
 * `validateScriptTree` requires non-blank unique ids, exactly one root, which must be the intent, parents that resolve without a cycle and whose kind the child's kind may refine, and temporal and interaction edges that resolve to another node. Only the refinement edge has consumers: the screenplay, the caption sidecar and `scriptAncestors` walk it. The temporal and interaction edges are checked for resolution and read by nothing else.
 *
 * @evidence contracts/common.md#principled-implementation A parent-pointer tree with id references for the cross edges, which `validateScriptTree` resolves through one id index and walks with a visited set to refuse cycles, so every consumer can follow `parent` to the root.
 * @evidence contracts/common.md#clear-and-simple-design The shared fields live once here and each node kind adds only its `kind` and payload, so the validator and the walkers read the edges without per-kind code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-references on the cross edges are refused rather than ignored, and the documentation states that the cross edges have no consumer instead of implying behavior they do not drive.
 * @evidence contracts/common.md#meaningful-documentation States every validator rule on the shared fields, which edge has consumers and who they are, and that the cross edges are only checked; members give each edge's direction and what `null` means.
 * @author Samchon
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
