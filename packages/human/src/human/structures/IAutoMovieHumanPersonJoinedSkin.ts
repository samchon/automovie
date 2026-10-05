import type {
  IAutoMovieMeshPhysicalVertices,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A person's skin halves joined into one Float32 triangle buffer by their
 * source identity, with the position of one source sample on it.
 *
 * @evidence contracts/common.md#principled-implementation The joined buffer keeps every half's declared source identity, so an instrument closes contours across the cut.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is welded by position; identity comes from the declared sources.
 * @evidence contracts/common.md#meaningful-documentation States what the buffer holds and what the anchor is.
 * @evidence contracts/modeling.md#spatial-conventions Float32 metres in the model frame.
 * @evidence contracts/modeling.md#shared-boundaries Shared boundary samples are one physical vertex of the buffer.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The buffer is a measuring view, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The buffer carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The buffer is read, never emitted.
 * @evidenceExclude contracts/modeling.md#rendered-observation The buffer is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The buffer carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The buffer admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The buffer converts no input.
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
