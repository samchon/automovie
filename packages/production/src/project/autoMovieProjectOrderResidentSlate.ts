import { IAutoMovieBeatEndState, IAutoMovieShot } from "@automovie/interface";
import { IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import { beatOf } from "./shotKey";
import { autoMovieProjectOrderByFilename } from "./autoMovieProjectOrderByFilename";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Copied shot and beat-end arrays sort by exact persisted filenames under code-unit order.
 * @evidence contracts/common.md#clear-and-simple-design Aligns commit results with directory-read order without another disk read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Other fields and record references stay unchanged; filename encoding can throw on lone surrogates.
 * @evidence contracts/common.md#meaningful-documentation States fresh arrays, borrowed records and unchanged non-keyed slices.
 * @evidence contracts/performance.md#efficient-algorithms Encoding and O(N log N) filename comparisons require N temporary references per population.
 * @evidence contracts/performance.md#reuse-equivalent-work Computed filenames serve this sort; no resident reads or cross-call cache occur.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh ordered arrays transfer to the caller; no handle or task is acquired.
 */
export function autoMovieProjectOrderResidentSlate(_project: IAutoMovieProjectState, slate: IAutoMovieLegacyWritableSlate): IAutoMovieLegacyWritableSlate {
    return {
        ...slate,
        shots: autoMovieProjectOrderByFilename(slate.shots, (shot: IAutoMovieShot): string => beatOf(shot.id) ?? shot.id),
        beatEnds: autoMovieProjectOrderByFilename(slate.beatEnds, (end: IAutoMovieBeatEndState): string => end.beat),
    };
}
