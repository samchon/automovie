import { AutoMovieTextureMediaType } from "./AutoMovieTextureMediaType";

/**
 * Media discriminator and dimensions inferred from recognized image headers.
 *
 * @evidence contracts/development/design.md#principled-representation readAutoMovieImageFacts reads signatures and dimension-bearing headers for its supported formats; these facts originate from supplied bytes rather than a file extension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Texture closure consumes a small media/extent projection while full decoding and asset provenance remain separate responsibilities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Header recognition does not prove complete encoding validity, checksums, pixel payload or successful decoding; callers supplying fixed facts must preserve their actual byte provenance.
 * @evidence contracts/development/common.md#meaningful-documentation Documents positive integer pixel extents and inferred supported media, without treating a signature as full-image conformance evidence.
 */
export interface IAutoMovieTextureImageFacts {
  /** Media type recognized from supported header bytes. */
  mediaType: AutoMovieTextureMediaType;

  /** Pixel width, a positive integer. */
  width: number;

  /** Pixel height, a positive integer. */
  height: number;
}
