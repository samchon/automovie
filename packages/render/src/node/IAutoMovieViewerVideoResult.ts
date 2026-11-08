import type { IAutoMovieRenderResult } from "../IAutoMovieRenderResult";
import type { IAutoMovieViewerFrameCacheReport } from "./cache/IAutoMovieViewerFrameCacheReport";

/**
 * Actual capture/encode observations; this result grants no editorial acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Counts, hashes and measured durations describe the runner's actual PNG captures and single encoder process.
 * @evidence contracts/common.md#clear-and-simple-design Extends the existing render result with execution observations rather than introducing another frame schedule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Playback observation and artistic quality are not inferred from captured bytes.
 * @evidence contracts/common.md#meaningful-documentation Members identify milliseconds, byte counts and bounded diagnostics; frame paths refer to released scratch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased output record chooses no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller decides whether retained observations remain relevant.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One metadata record per captured frame survives in the returned result; all PNG scratch and native handles are released before return.
 */
export interface IAutoMovieViewerVideoResult extends IAutoMovieRenderResult {
  /** Exact encode vector, including optional soundtrack mapping. */
  encodeArgs: string[];

  /** Per-frame SHA-256 and elapsed capture milliseconds; PNG files have been removed. */
  captures: {
    index: number;
    timeSeconds: number;
    sha256: string;
    bytes: number;
    captureMs: number;
  }[];

  /** Sum of actual PNG byte lengths before release. */
  capturedBytes: number;

  /** Single encoder process wall time in milliseconds. */
  encodeMs: number;

  /** Awaited same-page preparation wall time; zero when no callback was supplied. */
  prepareMs: number;

  /** Browser creation through encoding wall time in milliseconds, excluding final cleanup. */
  totalMs: number;

  /** Last 64 KiB of encoder stderr, decoded as UTF-8. */
  encoderLog: string;

  /** Frame cache counts; present only when `cacheDirectory` was supplied. Reused frames' `captureMs` measure the cache copy. */
  frameCache?: IAutoMovieViewerFrameCacheReport;
}
