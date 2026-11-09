import type { IAutoMovieRenderResult } from "@automovie/render";

import type { IAutoMovieViewerFrameCacheReport } from "./cache/IAutoMovieViewerFrameCacheReport";

/**
 * Actual capture/encode observations; this result grants no editorial acceptance.
 *
 * @evidence contracts/development/design.md#principled-representation Counts, hashes and measured durations describe the runner's actual PNG captures and single encoder process.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the existing render result with execution observations rather than introducing another frame schedule.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Playback observation and artistic quality are not inferred from captured bytes.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify milliseconds, byte counts and bounded diagnostics; frame paths refer to released scratch.
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
