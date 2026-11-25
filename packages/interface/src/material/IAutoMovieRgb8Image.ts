/**
 * Detached RGB8 raster and the caller-declared transfer function of its
 * samples.
 *
 * `decodeAutoMoviePpmImage` admits the dimensions and exact raster extent
 * before copying P6 bytes. It does not infer or convert transfer functions.
 * Recovery hosts consume sRGB rasters and attach their own source identity and
 * calibration; this image alone proves neither calibration nor source-byte
 * identity.
 */
export interface IAutoMovieRgb8Image {
  /** Positive safe-integer columns in pixels; width times height is safe. */
  width: number;

  /** Positive safe-integer rows in pixels. */
  height: number;

  /**
   * Caller-owned mutable bytes, top row first and left to right, RGB per pixel
   * with no padding or alpha; length is exactly 3 * width * height.
   */
  rgb8: Uint8Array;

  /**
   * Sample transfer convention supplied by the caller; bytes retain their
   * encoded values, including when declared linear.
   */
  transfer: "srgb" | "bt709" | "linear";
}
