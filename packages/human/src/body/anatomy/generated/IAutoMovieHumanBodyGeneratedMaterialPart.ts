import type { IAutoMovieHumanBodyGeneratedSolid } from "./IAutoMovieHumanBodyGeneratedSolid";

/**
 * One generated part bound to its id and tissue material.
 *
 * `IAutoMovieHumanBodyGeneratedPart` distributes this record over every part
 * id with its tissue, so a right femur cannot carry muscle and a left deltoid
 * cannot answer as bone. A part owns one or more closed solids; separated
 * islands are never welded across empty space.
 *
 * @evidence contracts/common.md#principled-implementation Id, tissue and solids are one record so a value cannot detach from its identity.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the per-id inline object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A part needs at least one solid; an empty part cannot claim resolution.
 * @evidence contracts/common.md#meaningful-documentation States how the union uses the record.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each record names one part and the tissue it is made of, with its solids as members.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The solid type owns emitted geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The solid type owns the frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is generated output, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGeneratedMaterialPart<
  Id extends string,
  Tissue extends string,
> {
  /** Tissue material of every solid in this part. */
  readonly tissue: Tissue;
  /** The part's closed identity. */
  readonly id: Id;
  /** One or more closed solids the part consists of. */
  readonly solids: readonly [
    IAutoMovieHumanBodyGeneratedSolid,
    ...IAutoMovieHumanBodyGeneratedSolid[],
  ];
}
