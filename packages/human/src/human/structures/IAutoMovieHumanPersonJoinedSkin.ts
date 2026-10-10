import type {
  IAutoMovieMeshPhysicalVertices,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A person's skin halves joined into one Float32 triangle buffer by their
 * source identity, with the position of one source sample on it.
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
