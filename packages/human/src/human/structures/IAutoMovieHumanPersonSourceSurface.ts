import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";

/**
 * One skin surface as source-partition admission reads it: flat positions in metres, flat triangle index triples, and its compiled source partition when the basis carries one.
 *
 * @evidence contracts/common.md#principled-implementation Flat position and triangle arrays identify actual skin geometry while an optional compiled partition preserves the supported legacy state explicitly.
 * @evidence contracts/common.md#clear-and-simple-design Admission receives only geometry and correspondence metadata; it does not need a whole face or body build.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted source partitions represent the documented legacy path, not generated correspondence fabricated for a preferred surface.
 * @evidence contracts/common.md#meaningful-documentation Comments state metres, triangle-index triples and the meaning of an absent compiled source partition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A surface operand selects no coverage or geometry algorithm; source-domain admission owns scans of these arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Read-only surface fields are borrowed operands, not a memoization scheme for equivalent geometry requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The surface transport declares no owned external resource; its caller retains the position, index and optional partition records.
 *
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
