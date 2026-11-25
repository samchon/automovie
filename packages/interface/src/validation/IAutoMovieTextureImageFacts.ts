import type { AutoMovieTextureMediaType } from "./AutoMovieTextureMediaType";

/** Media discriminator and dimensions inferred from recognized image headers. */
export interface IAutoMovieTextureImageFacts {
  /** Media type recognized from supported header bytes. */
  mediaType: AutoMovieTextureMediaType;

  /** Pixel width, a positive integer. */
  width: number;

  /** Pixel height, a positive integer. */
  height: number;
}
