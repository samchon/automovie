/**
 * One admitted stream-zero framemd5 row. auditAutoMovieDecodedFrames checks
 * nonnegative safe-integer presentation ticks, positive duration, positive
 * raster byte count and equal decode/presentation timestamps. Adjacent
 * identical image digests are allowed holds.
 */
export interface IAutoMovieDecodedFrame {
  /** Decoder stream index. */
  stream: number;

  /** Presentation timestamp, time-base ticks. */
  pts: number;

  /** Presentation duration, time-base ticks. */
  duration: number;

  /** Lowercase MD5 of the decoded image bytes. */
  md5: string;
}
