/** Maps one contiguous protected byte span back to the immutable source. */
export interface IProjectionSegment {
  /** Byte offset of the protected span in the original file. */
  originalStart: number;
  /** Byte offset of the span after owned metadata is removed. */
  projectedStart: number;
  /** Number of bytes retained unchanged in this span. */
  length: number;
}
