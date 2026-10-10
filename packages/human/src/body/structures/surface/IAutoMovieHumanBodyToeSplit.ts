import type { AutoMovieHumanBodyToeBone } from "../rig/AutoMovieHumanBodyToeBone";

/**
 * How one surface's toes skin weight divides among the toe ray phalanges.
 *
 * Each listed vertex carries a positive weight on a humanoid toes bone; its
 * rows split its whole toes weight (both sides' toes bones together, as on a
 * few midline source vertices) among phalanges by shares summing to one, so the vertex's other influences and every unlisted vertex keep their
 * weights exactly. Vertex `i` owns rows `offsets[i]` up to `offsets[i + 1]`.
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
