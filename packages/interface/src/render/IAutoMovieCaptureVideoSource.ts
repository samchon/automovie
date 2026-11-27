/**
 * What a capture of a video file records about the file: its path, the
 * threshold its cuts were detected at, and every cut with its score.
 *
 * The capture request parser admits the threshold on the 0 to 100 scdet scale;
 * the report reader requires finite cut seconds and scores. The source path is
 * descriptive text, not a file handle or permission to read it.
 */
export interface IAutoMovieCaptureVideoSource {
  /** Path of the video file. */
  file: string;

  /** `scdet` score at which a frame started a new scene. */
  threshold: number;

  /** Every detected cut: the second its new scene starts and its score. */
  cuts: {
    /** Video-local second of the first frame after the detected cut. */
    seconds: number;

    /** FFmpeg scdet change score on its 0 to 100 scale. */
    score: number;
  }[];
}
