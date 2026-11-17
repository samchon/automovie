/**
 * What a capture of a video file records about the file: its path, the threshold its cuts were detected at, and every cut with its score.
 *
 * The capture request parser admits the threshold on the 0 to 100 scdet scale; the report reader requires finite cut seconds and scores. The source path is descriptive text, not a file handle or permission to read it.
 *
 * @evidence contracts/development/design.md#principled-representation The file, the `scdet` threshold on its 0 to 100 score and each cut's second in the file's time with its score, so a reader knows which cuts the windows came from and that an empty list means none at that threshold.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Video capture supplies this source provenance to the general capture run, while scene-cut report reading supplies its cuts and persisted records retain it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cut is an empty list, not an absent member.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its unit.
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
