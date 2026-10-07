import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

/**
 * The `automoviePhysicalVertices` primitive extras that
 * `readHumanMeshPhysicalVertices` admits exactly.
 *
 * The table holds the domain/ID pairs; the named Uint16 VEC2 attribute holds
 * each vertex's index+1 into it, or zero for position-derived incidence.
 * Source pairs keep the mesh model's own definition.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the mesh model's source-pair type and fixes the version and attribute name as literals the reader admits.
 * @evidence contracts/common.md#clear-and-simple-design Three named fields replace an anonymous admission type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source pairs are table entries, never Float32 attributes or inferred contact.
 * @evidence contracts/common.md#meaningful-documentation States the reader, the attribute encoding and the zero convention.
 * @author Samchon
 */
export interface IHumanMeshPhysicalSourceTable {
  /** Supported namespace version. */
  version: 1;

  /** Name of the accessor holding low/high words of each vertex reference. */
  attribute: "_AUTOMOVIE_PHYSICAL_SOURCE";

  /** Source domain/ID pairs addressed by reference minus one. */
  sources: IAutoMovieMeshPhysicalSource[];
}
