/**
 * Raw image samples supplied to the deterministic PNG encoder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Raw image samples supplied to the deterministic PNG encoder. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Pixel dimensions and an interleaved byte buffer remain distinct from the encoder's base64 output.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Procedural image callers supply IProps; image ids and MIME metadata remain with IAutoMovieImage.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The closed channel count names the supported PNG subset without promising compression or color conversion.
 */
export namespace IAutoMovieEncodePng {
  /**
   * Borrowed 8-bit interleaved pixels for encodeAutoMoviePng. The encoder reads without mutation and returns padded base64 PNG bytes without a data: prefix; image identity is assigned separately by the caller.
   *
   * Output uses bit depth 8, no interlace, filter zero and stored deflate blocks, with no compression or color-management metadata. Dimensions/channel count/buffer length are checked before encoding; host allocation failures still propagate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines pixel layout, channel meanings, borrowed ownership, base64 output and admission.
   * @evidence contracts/development/design.md#principled-representation Dimensions count pixels and pixels holds bytes rather than ids or encoded text; the channel union limits supported PNG color types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Procedural image producers supply only dimensions and raw samples; IAutoMovieImage separately owns ids, MIME type and the returned encoded content.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid sample counts are refused rather than padded; positive safe dimensions do not promise an allocatable PNG or additional color conversion.
   */
  export type IProps = {
    /** Positive safe integer columns in pixels, checked by the encoder. */
    width: number;

    /** Positive safe integer rows in pixels, checked by the encoder. */
    height: number;

    /** Bytes per pixel: 1 grayscale, 2 grayscale/alpha, 3 RGB, 4 RGBA; this order is preserved. */
    channels: 1 | 2 | 3 | 4;

    /** Row-major interleaved samples in supplied row order, exactly width*height*channels bytes. The encoder performs no vertical flip, premultiplication or color conversion. */
    pixels: Uint8Array;
  };
}
