/** Raw image samples supplied to the deterministic PNG encoder. */
export namespace IAutoMovieEncodePng {
  /**
   * Borrowed 8-bit interleaved pixels for encodePng. The encoder reads
   * without mutation and returns padded base64 PNG bytes without a data:
   * prefix; image identity is assigned separately by the caller.
   *
   * Output uses bit depth 8, no interlace, filter zero and stored deflate
   * blocks, with no compression or color-management metadata.
   * Dimensions/channel count/buffer length are checked before encoding; host
   * allocation failures still propagate.
   */
  export type IProps = {
    /** Positive safe integer columns in pixels, checked by the encoder. */
    width: number;

    /** Positive safe integer rows in pixels, checked by the encoder. */
    height: number;

    /**
     * Bytes per pixel: 1 grayscale, 2 grayscale/alpha, 3 RGB, 4 RGBA; this
     * order is preserved.
     */
    channels: 1 | 2 | 3 | 4;

    /**
     * Row-major interleaved samples in supplied row order, exactly
     * width_height_channels bytes. The encoder performs no vertical flip,
     * premultiplication or color conversion.
     */
    pixels: Uint8Array;
  };
}
