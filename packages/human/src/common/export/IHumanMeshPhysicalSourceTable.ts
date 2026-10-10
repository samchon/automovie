import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

/**
 * The `automoviePhysicalVertices` primitive extras that
 * `readHumanMeshPhysicalVertices` admits exactly.
 *
 * The table holds the domain/ID pairs; the named Uint16 VEC2 attribute holds
 * each vertex's index+1 into it, or zero for position-derived incidence.
 * Source pairs keep the mesh model's own definition.
 *
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
