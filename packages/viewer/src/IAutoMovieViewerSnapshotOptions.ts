/**
 * Options for reading one rendered viewer frame as an inline image.
 *
 * @evidence contracts/common.md#principled-implementation Supplies optional requested image MIME and encoder quality, with absent MIME using PNG in the snapshot adapter.
 * @evidence contracts/common.md#clear-and-simple-design Small encoding preferences remain separate from renderer acquisition, source/hardware admission and actual encoded payload metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field presence certifies image bytes and requested MIME may undergo native encoder fallback; supported quality/range and failure behavior belong to the original canvas encoder.
 * @evidence contracts/common.md#meaningful-documentation Documents PNG default, quality only for supporting formats and distinction between requested MIME and actual payload.
 * @evidence contracts/performance.md#efficient-algorithms Two optional scalar values are fixed metadata, while encoding work scales with actual canvas pixels/format.
 * @evidence contracts/performance.md#reuse-equivalent-work Options can be borrowed repeatedly but matching MIME/quality does not make different rendered pixels equivalent or cacheable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record holds no canvas/image/native handle and acquires no resource; returned encoded payload lifetime belongs to its snapshot consumer.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSnapshotOptions {
  /** Image MIME type. Defaults to `image/png`. */
  mimeType?: string;

  /** Encoder quality for formats that support it. */
  quality?: number;
}
