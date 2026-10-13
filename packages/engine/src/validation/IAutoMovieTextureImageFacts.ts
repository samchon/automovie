import { AutoMovieTextureMediaType } from "./AutoMovieTextureMediaType";

/**
 * Image facts read from an asset's own bytes, never from its file name.
 *
 * A manifest can claim anything; a PNG signature cannot. The builder hands
 * these in so this validator stays a pure function of facts, and so the same
 * closure runs against probed bytes in the builder and against fixed facts in
 * a test.
 */
export interface IAutoMovieTextureImageFacts {
  /** IANA media type the bytes themselves prove. */
  mediaType: AutoMovieTextureMediaType;
  /** Pixel width, a positive integer. */
  width: number;
  /** Pixel height, a positive integer. */
  height: number;
}
