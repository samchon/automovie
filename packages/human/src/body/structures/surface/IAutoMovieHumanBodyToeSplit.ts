import type { AutoMovieHumanBodyToeBone } from "../rig/AutoMovieHumanBodyToeBone";

/**
 * How one surface's toes skin weight divides among the toe ray phalanges.
 *
 * Each listed vertex carries a positive weight on a humanoid toes bone; its
 * rows split its whole toes weight (both sides' toes bones together, as on a
 * few midline source vertices) among phalanges by shares summing to one, so the vertex's other influences and every unlisted vertex keep their
 * weights exactly. Vertex `i` owns rows `offsets[i]` up to `offsets[i + 1]`.
 *
 * @evidence contracts/common.md#principled-implementation Splitting the existing toes weight leaves every other weight and the rays-at-rest result unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Compressed rows keyed by sorted vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shares must sum to one, so the split cannot add or lose weight.
 * @evidence contracts/common.md#meaningful-documentation States the share meaning and the row layout.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each row names the phalanx a share belongs to.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder's consumer renders the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source weights own the division.
 * @evidenceExclude contracts/anatomy.md#permitted-range Basis admission checks the rows.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is basis data, not an authoring input.
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
