/**
 * Parsed FFprobe stream records read by the encoded presentation audit.
 * Required fields are the values FFprobe must provide; optional fields apply
 * only to codecs and stream kinds that carry them.
 */
export interface IAutoMovieAuditEncodedPresentationProbe {
  /** Streams reported for the delivered media file. */
  streams: readonly {
    /** FFprobe stream kind. */ codec_type: string;
    /** FFprobe codec name. */ codec_name: string;
    /** Video width in pixels, when present. */ width?: number;
    /** Video height in pixels, when present. */ height?: number;
    /** Average video frame rate, when present. */ avg_frame_rate?: string;
    /** Audio sample rate, when present. */ sample_rate?: string;
    /** Audio channel count, when present. */ channels?: number;
    /** Stream time base as a rational string. */ time_base: string;
    /** Duration in native time-base ticks. */ duration_ts: number | string;
    /** Stream start time in seconds. */ start_time: string;
  }[];
}
