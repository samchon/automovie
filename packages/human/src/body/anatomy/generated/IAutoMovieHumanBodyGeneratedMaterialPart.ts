import type { IAutoMovieHumanBodyGeneratedSolid } from "./IAutoMovieHumanBodyGeneratedSolid";

/**
 * One generated part bound to its id and tissue material.
 *
 * `IAutoMovieHumanBodyGeneratedPart` distributes this record over every part
 * id with its tissue, so a right femur cannot carry muscle and a left deltoid
 * cannot answer as bone. A part owns one or more closed solids; separated
 * islands are never welded across empty space.
 *
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
