import type {
  IAutoMovieMeshPhysicalVertices,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A person's skin halves joined into one Float32 triangle buffer by their source identity, with the position of one source sample on it. The producer gathers every registered mesh containing the selected physical domain; this record itself proves neither skin-only membership nor a closed manifold.
 *
 * @evidence contracts/common.md#principled-implementation Float32-quantized half buffers retain physical source correspondence so section readers can connect a head/body cut at shared sample identities.
 * @evidence contracts/common.md#clear-and-simple-design Joined positions, triangles, physical metadata and one requested anchor travel together as the section instrument's operand.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical source identity supplies correspondence rather than geometric tolerance welding that could merge unrelated skin residents.
 * @evidence contracts/common.md#meaningful-documentation Members state metre precision, index addressing, position-aligned physical correspondence and requested source anchor.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The joined Float32 skin and source correspondence result specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the joined Float32 skin and source correspondence result; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The joined Float32 skin and source correspondence result acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonJoinedSkin {
  /** Float32-quantized XYZ positions of every joined half, metres. */
  positions: number[];

  /** Triangle vertex indices into `positions`. */
  indices: number[];

  /** The halves' source correspondence, aligned with `positions`. */
  physicalVertices: IAutoMovieMeshPhysicalVertices;

  /** The Float32 position of the requested source sample. */
  anchor: IAutoMovieVector3;
}
