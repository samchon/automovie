import type { IAutoMovieHumanBodyGeneratedSolid } from "./IAutoMovieHumanBodyGeneratedSolid";

/**
 * One generated part bound to its id and tissue material.
 *
 * `IAutoMovieHumanBodyGeneratedPart` distributes this record over every part id with its tissue, so a right femur cannot carry muscle and a left deltoid cannot answer as bone. A part owns one or more closed solids; separated islands are never welded across empty space.
 *
 * @evidence contracts/common.md#principled-implementation Generic identity/tissue pairing and a nonempty solid tuple represent one independently owned anatomical material region.
 * @evidence contracts/common.md#clear-and-simple-design The shared record is distributed over catalogue identities to preserve anatomical-material correlation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Separated islands remain independent closed solids instead of being welded through empty space.
 * @evidence contracts/common.md#meaningful-documentation Members specify closed identity, tissue consistency and nonempty constituent solids.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A material-part schema constructs no tetrahedra or surface material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Identity/tissue correlation implements no generated-solid result reuse itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Solid references belong to generated output, without active material resources.
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
