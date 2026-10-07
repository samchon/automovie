import type { IAutoMovieHumanPersonSourceCell } from "./IAutoMovieHumanPersonSourceCell";

/**
 * One fixed source normal cell: a source cell with exactly three oriented
 * canonical samples and one deformation-side domain per corner.
 *
 * @evidence contracts/common.md#principled-implementation A fixed normal cell is a source cell plus the deformation domain of each corner.
 * @evidence contracts/common.md#clear-and-simple-design Narrows the shared source cell and adds one field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Domains come from the compiled subdivision, or zero for an implicit raw cell; nothing is inferred.
 * @evidence contracts/common.md#meaningful-documentation States what the cell adds and how domains default.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A cell defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A cell names existing source lineage and emits nothing.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Ordinals, IDs and domains carry no frame or unit.
 * @evidence contracts/modeling.md#shared-boundaries Both complementary skins read normals through the same fixed cells.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalCell extends IAutoMovieHumanPersonSourceCell {
  /** Oriented canonical sample IDs of the three corners. */
  samples: [number, number, number];

  /** Nonnegative deformation-side domain of each corner. */
  domains: [number, number, number];
}
