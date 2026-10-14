import type { AutoMovieHumanBodyToeBone } from "../rig/AutoMovieHumanBodyToeBone";

/**
 * How one surface's toes skin weight divides among the toe ray phalanges.
 *
 * Each listed vertex carries a positive weight on a humanoid toes bone; its
 * rows split its whole toes weight (both sides' toes bones together, as on a
 * few midline source vertices) among phalanges by shares summing to one, so the vertex's other influences and every unlisted vertex keep their
 * weights exactly. Vertex `i` owns rows `offsets[i]` up to `offsets[i + 1]`.
 *
 * @evidence contracts/common.md#principled-implementation Sparse vertex rows redistribute existing common toes weight over named phalanges with per-vertex shares summing to one.
 * @evidence contracts/common.md#clear-and-simple-design Vertex offsets and bone-table indices expose one compact row representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unlisted vertices and non-toe influences retain their weights rather than being globally rebound.
 * @evidence contracts/common.md#meaningful-documentation Members state ascending vertex order, final offset sentinel and unit-sum shares.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The toe influence split schema has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The toe influence split schema schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The toe influence split schema declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyToeSplit {
  /** Phalanges the rows refer to. */
  bones: AutoMovieHumanBodyToeBone[];

  /** Vertices whose toes weight is split, ascending. */
  vertices: number[];

  /** Row start of each vertex, with one final end; length `vertices.length + 1`. */
  offsets: number[];

  /** Index into `bones` per row. */
  bonesIndex: number[];

  /** Share of the vertex's toes weight per row; a vertex's shares sum to one. */
  shares: number[];
}
