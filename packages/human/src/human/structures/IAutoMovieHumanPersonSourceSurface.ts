import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";

/**
 * One skin surface as source-partition admission reads it: flat positions in
 * metres, flat triangle index triples, and its compiled source partition when
 * the basis carries one.
 *
 * @evidence contracts/common.md#principled-implementation Admission needs only the surface's populations and its compiled partition.
 * @evidence contracts/common.md#clear-and-simple-design Three members, a subset every basis skin surface already has.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The partition is the basis's own compiled record; absence is preserved, never synthesized.
 * @evidence contracts/common.md#meaningful-documentation States each member, its units and what absence means.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The surface is an existing basis skin; this view defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The view emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres in the shared Y-up, +Z-forward basis frame.
 * @evidence contracts/modeling.md#shared-boundaries The face and body skins are admitted together as complementary halves of one source tree.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSurface {
  /** Flat vertex positions, metres. */
  positions: readonly number[];

  /** Flat triangle vertex index triples. */
  indices: readonly number[];

  /** Compiled source partition, or none for a legacy surface. */
  sourcePartition?: IAutoMovieHumanBasisSourcePartition;
}
