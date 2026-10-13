/**
 * Common shape of every screenplay node: the refinement edge plus the two
 * cross-cutting edges of the refinement graph.
 */
export interface IAutoMovieScriptNodeBase {
  /** Stable id, unique across the whole tree. */
  id: string;

  /**
   * The refinement edge: the parent this node makes concrete, or `null` for the
   * single intent root. The refinement axis is a strict tree (acyclic, one
   * root); feedback propagates up this chain.
   */
  parent: string | null;

  /**
   * The temporal edge: the node this one follows on the timeline (a beat
   * continuing from the previous beat, aligning with the beat-end continuity
   * handoff), or `null` when nothing precedes it.
   */
  temporal: string | null;

  /**
   * Cross-cutting interaction edges: nodes this one plays against (the beat of
   * the opponent in a duel). Free-form, validated to resolve.
   */
  interactsWith: string[];
}
