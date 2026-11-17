/**
 * Detached RGB8 raster and the caller-declared transfer function of its samples.
 *
 * `decodeAutoMoviePpmImage` admits the dimensions and exact raster extent before
 * copying P6 bytes. It does not infer or convert transfer functions. Recovery
 * hosts consume sRGB rasters and attach their own source identity and calibration;
 * this image alone proves neither calibration nor source-byte identity.
 *
 * @evidence contracts/development/design.md#principled-representation Positive pixel dimensions determine a packed three-channel raster; the explicit transfer tag preserves sample interpretation without colour conversion. The ingest decoder validates the dimensions and extent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The image owns only raster facts used by PPM callers; encoded image assets and calibrated recovery views remain separate concepts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No alpha, inferred colour space or calibration is fabricated. Numeric dimension and buffer-length relationships require decoder admission.
 * @evidence contracts/development/common.md#meaningful-documentation Members state pixel units, row and channel order, transfer meaning and detached mutable ownership.
 */
export interface IAutoMovieRgb8Image {
  /** Positive safe-integer columns in pixels; width times height is safe. */
  width: number;

  /** Positive safe-integer rows in pixels. */
  height: number;

  /** Caller-owned mutable bytes, top row first and left to right, RGB per pixel with no padding or alpha; length is exactly 3 * width * height. */
  rgb8: Uint8Array;

  /** Sample transfer convention supplied by the caller; bytes retain their encoded values, including when declared linear. */
  transfer: "srgb" | "bt709" | "linear";
}
