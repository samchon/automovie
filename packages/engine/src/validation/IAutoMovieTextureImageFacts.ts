import { AutoMovieTextureMediaType } from "./AutoMovieTextureMediaType";

/**
 * Media discriminator and dimensions inferred from recognized image headers.
 *
 * @evidence contracts/common.md#principled-implementation readAutoMovieImageFacts reads signatures and dimension-bearing headers for its supported formats; these facts originate from supplied bytes rather than a file extension.
 * @evidence contracts/common.md#clear-and-simple-design Texture closure consumes a small media/extent projection while full decoding and asset provenance remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Header recognition does not prove complete encoding validity, checksums, pixel payload or successful decoding; callers supplying fixed facts must preserve their actual byte provenance.
 * @evidence contracts/common.md#meaningful-documentation Documents positive integer pixel extents and inferred supported media, without treating a signature as full-image conformance evidence.
 * @evidence contracts/performance.md#efficient-algorithms This three-field record performs no byte scan or pixel allocation; its parser owns bounded header reads and format-specific traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work The same facts structure serves byte-reader and closure tests, without an additional inferred-extension schema or image cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only media and dimension scalars survive; the row retains no original byte buffer, decoded pixels or renderer handle.
 * @author Samchon
 */
export interface IAutoMovieTextureImageFacts {
  /** Media type recognized from supported header bytes. */
  mediaType: AutoMovieTextureMediaType;

  /** Pixel width, a positive integer. */
  width: number;

  /** Pixel height, a positive integer. */
  height: number;
}
