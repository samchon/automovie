import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

/**
 * Actual resident normal refusal and its local incident geometry, without changing either.
 *
 * @evidence contracts/common.md#principled-implementation One actual failing normal retains Float32 length, incident triangles/areas and optional source lineage; resident area sums do not certify the larger normal-construction population.
 * @evidence contracts/common.md#clear-and-simple-design Evidence collection remains separate from normal construction, topology admission and repair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No corrected direction, guessed identity or fitted triangle replaces refused resident data.
 * @evidence contracts/common.md#meaningful-documentation Comments give vertex/face ordinals, original/rounded directions, square-metre areas, incident positions and optional lineage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface executes no normal scan or incident accumulation; the producing reader owns them.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result defines no cross-mesh normal cache or equivalence rule.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete copied incident data lives with its receiver and scales with the mesh, without native handles, tasks or permanent storage.
 *
 *
 * @author Samchon
 */
export interface IHumanMeshNormalRefusal {
  /** Resident vertex identity. */
  vertex: number;

  /** Original direction before quantization. */
  original: number[];

  /** Direction actually stored at Float32 precision. */
  float32: number[];

  /** Actual Float32 direction length. */
  length: number;

  /** Every resident triangle that references this vertex. */
  faces: number[];

  /** Sum of oriented twice-area vectors on this resident mesh, square metres. */
  areaSum: number[];

  /** Oriented twice-area of each face in the same order as faces. */
  faceAreas: number[][];

  /** Original resident positions of each incident triangle, flat XYZ triples. */
  facePositions: number[][];

  /** Original physical lineage, when the mesh supplies it. */
  physical: IAutoMovieMeshPhysicalSource | null;
}
