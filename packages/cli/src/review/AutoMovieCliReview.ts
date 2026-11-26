import type { AutoMovieCliReviewTypes } from "./AutoMovieCliReviewTypes";
import type { IAutoMovieCliReviewObservation } from "./IAutoMovieCliReviewObservation";
import { AUTOMOVIE_REVIEW_OPTIONS } from "./internal/AUTOMOVIE_REVIEW_OPTIONS";
import { readAutoMovieReviewObservation } from "./internal/readAutoMovieReviewObservation";
import { readAutoMovieReviewOptions } from "./internal/readAutoMovieReviewOptions";
import { recordAutoMoviePlayback } from "./internal/recordAutoMoviePlayback";
import { reviewAutoMovie } from "./internal/reviewAutoMovie";
import { reviewAutoMovieFile } from "./internal/reviewAutoMovieFile";

/** Public operations for Inspector playback and file-bound review receipts. */
export namespace AutoMovieCliReview {
  /** Command options admitted by `readOptions`. */
  export const OPTIONS: readonly string[] = AUTOMOVIE_REVIEW_OPTIONS;

  /** Admit exactly one Inspector recording or file-bound review request. */
  export function readOptions(
    values: ReadonlyMap<string, string>,
  ): AutoMovieCliReviewTypes.Options {
    return readAutoMovieReviewOptions(values);
  }

  /** Run the `automovie review` command. */
  export function review(
    props: AutoMovieCliReviewTypes.ReviewProps,
  ): Promise<number> {
    return reviewAutoMovie(props);
  }

  /** Create, explicitly rebind or replay a review mark for a published file. */
  export function reviewFile(
    props: AutoMovieCliReviewTypes.ReviewFileProps,
  ): Promise<IAutoMovieCliReviewObservation> {
    return reviewAutoMovieFile(props);
  }

  /** Record real-time playback of an Inspector page. */
  export function recordPlayback(
    props: AutoMovieCliReviewTypes.PlaybackProps,
  ): Promise<AutoMovieCliReviewTypes.PlaybackRecord> {
    return recordAutoMoviePlayback(props);
  }

  /** Admit one stored review receipt and its selected scope. */
  export function readObservation(
    value: unknown,
  ): IAutoMovieCliReviewObservation {
    return readAutoMovieReviewObservation(value);
  }
}
