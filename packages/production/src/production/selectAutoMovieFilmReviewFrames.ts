import { IAutoMovieFilmTimelineSegment, IAutoMovieShotContract } from "@automovie/interface";
import type { IAutoMovieFilmReviewFrame } from "./IAutoMovieFilmReviewFrame";

/**
 * Select authored review samples within a half-open source trim, or one source-in beauty fallback.
 *
 * @evidence contracts/common.md#principled-implementation Rounds each authored time times fps and filters sourceInFrame <= index < sourceOutFrame, preserving authored order; a nonempty admitted range and positive finite fps are caller premises rather than independently validated here.
 * @evidence contracts/common.md#clear-and-simple-design One selector owns trim membership and fallback, retaining original public capability without introducing a render host; current repository application callers are absent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No title/prose changes membership; source-out is excluded and empty filtered population receives the declared source-in beauty fallback, not fabricated captured evidence.
 * @evidence contracts/common.md#meaningful-documentation Defines rounded frame indices with unchanged authored time, borrowed passes and source-in fallback id/time/pass; no review receipt or frame capture is produced.
 * @evidence contracts/performance.md#efficient-algorithms Scans R authored review samples and allocates up to R shallow result records, or one fallback; copied result records borrow authored nested pass arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work One rounded index serves each membership decision and returned record; no repeated filter or cross-call review cache is added.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Results transfer to the caller, with at most R selected records or one fallback; no descriptor, byte inventory or task is retained.
 */
export function selectAutoMovieFilmReviewFrames(segment: IAutoMovieFilmTimelineSegment, shot: IAutoMovieShotContract, fps: number): IAutoMovieFilmReviewFrame[] {
    const selected: IAutoMovieFilmReviewFrame[] = shot.reviewFrames.flatMap((frame: IAutoMovieShotContract['reviewFrames'][number]): IAutoMovieFilmReviewFrame[] => {
        const index: number = Math.round(frame.time * fps);
        return index < segment.sourceInFrame || index >= segment.sourceOutFrame
            ? []
            : [{ ...frame, index }];
    });
    return selected.length !== 0
        ? selected
        : [
            {
                id: "film-segment-entry",
                time: segment.sourceInFrame / fps,
                index: segment.sourceInFrame,
                passes: ["beauty"],
            },
        ];
}
