/**
 * Options for reading one rendered viewer frame as an inline image.
 *
 * @evidence contracts/development/design.md#principled-representation Supplies optional requested image MIME and encoder quality, with absent MIME using PNG in the snapshot adapter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Small encoding preferences remain separate from renderer acquisition, source/hardware admission and actual encoded payload metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No field presence certifies image bytes and requested MIME may undergo native encoder fallback; supported quality/range and failure behavior belong to the original canvas encoder.
 * @evidence contracts/development/common.md#meaningful-documentation Documents PNG default, quality only for supporting formats and distinction between requested MIME and actual payload.
 */
export interface IAutoMovieViewerSnapshotOptions {
  /** Image MIME type. Defaults to `image/png`. */
  mimeType?: string;

  /** Encoder quality for formats that support it. */
  quality?: number;
}
