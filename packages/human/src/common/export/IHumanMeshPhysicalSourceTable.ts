import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

/**
 * The `automoviePhysicalVertices` primitive extras that
 * `readHumanMeshPhysicalVertices` admits exactly.
 *
 * The table holds the domain/ID pairs; the named Uint16 VEC2 attribute holds
 * each vertex's index+1 into it, or zero for position-derived incidence.
 * Source pairs keep the mesh model's own definition.
 *
 *
 * @evidence contracts/common.md#principled-implementation Versioned extras hold domain/ID pairs, while an unnormalized Uint16 VEC2 accessor carries low/high words of each index-plus-one reference with zero for legacy incidence.
 * @evidence contracts/common.md#clear-and-simple-design The table separates opaque source identity from portable accessor references and is admitted by readHumanMeshPhysicalVertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Attribute references never truncate opaque safe-integer source IDs or imply anatomical/provenance qualification.
 * @evidence contracts/common.md#meaningful-documentation Documents namespace version, exact accessor name and reference-minus-one interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This metadata type performs no encoding, decoding or geometry-resolver traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Carried physical-source metadata is not a cached generation or coordinated computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Writer/reader own copied source pairs and references; the table declaration acquires no primitive or handle.
 *
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
