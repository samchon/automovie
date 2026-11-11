import type { IAutoMovieRenderSpec } from "@automovie/interface";

import type { IAutoMovieDrawPage } from "@automovie/render";

/**
 * Draw a film's frames through the production's draw-only page and encode one MP4.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit route, frame clock, raster and executables describe the existing browser and encoder boundaries; every frame comes from the page's draw function.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One options record owns execution inputs; scene, sound design and review admission remain with the production.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No production identity or acceptance policy enters this generic record.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, defaults, ownership and cancellation behavior.
 */
export interface IAutoMovieViewerVideoOptions {
  /** Address of the production's draw-only page, `render/index.html` of its server. */
  url: string;

  /** Name of the film to draw. */
  subject: string;

  /** Output raster, rate and encoding controls; yuv420p requires even dimensions. */
  spec: IAutoMovieRenderSpec;

  /** Positive seconds whose product with fps must be a positive safe integer. */
  durationSeconds: number;

  /** Parent directory for a newly allocated, exclusively owned PNG scratch directory. */
  frameDir: string;

  /** MP4 destination, replaced by FFmpeg on successful encoding. */
  outputPath: string;

  /** Installed Chrome or Chromium executable; absent, the Chromium build Playwright pins. */
  chromeExecutable?: string;

  /** Installed FFmpeg executable, for example the path exported by ffmpeg-static. */
  ffmpegExecutable: string;

  /** Optional complete soundtrack; its first audio stream is padded/trimmed to the film clock. */
  audioMix?: string;

  /**
   * Prepare fixed media from the already loaded capture page, once before frame zero.
   *
   * The page remains the renderer's; this callback may evaluate the host's public
   * readiness and media APIs, then return a complete soundtrack path. A returned
   * audioMix overrides the input path. Rejection prevents all captures and encoding.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The callback receives only the existing public page-evaluation transport after navigation and hook admission. Its awaited result supplies media from the actual capture runtime before the exact frame clock starts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional preparation effect connects host-owned fixed media to the existing soundtrack input without opening another browser or defining production policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preparation evaluates the supplied public host API; it neither replaces viewer globals nor fabricates frames or acceptance evidence. Returned paths pass the same encoder admission as an input audioMix.
   * @evidence contracts/development/common.md#meaningful-documentation Documents timing, ownership, override semantics and rejection behavior. Evaluation functions must be self-contained and serialize their data through the supplied argument.
   * @evidence contracts/development/implementation.md#efficient-algorithms Invoked once per render, with its actual wall time returned separately as prepareMs; host computations and retained media belong to the caller.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same already navigated page and runtime as every captured frame; no duplicate scene preparation or independent browser session is required.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The renderer retains the callback only for its operation and closes its session after failure or cancellation. The caller owns files and other resources created by preparation and must bound or cancel its work.
   */
  prepare?: (
    page: Pick<IAutoMovieDrawPage, "evaluate">,
  ) => Promise<{ audioMix?: string }>;

  /**
   * Directory of the persistent frame cache; omitted captures every frame.
   *
   * Use an ignored, disposable path such as `.cache/frames/<film>`, one per
   * rendered output, and one render at a time per directory. The page must
   * publish `frameDigestFunction`. Frames whose key is stored are reused,
   * captured frames are stored immediately (an interrupted run resumes where
   * it stopped), and entries the successful run did not reference are deleted.
   */
  cacheDirectory?: string;

  /**
   * Page function returning one frame's state digest; defaults to
   * `__afFrameDigest`. Read only with `cacheDirectory`.
   *
   * The page calls it as `fn(seconds)` for every frame before capture; it
   * returns (or resolves to) a nonempty string that changes whenever anything
   * that could change that frame's pixels changes: the scene state placed at
   * that second, the assets and code drawing it, fonts. It must not move the
   * scene. Frame time, raster, route, film, package versions,
   * browser build and GL renderer are added by the renderer.
   */
  frameDigestFunction?: string;

  /**
   * Recapture every n-th reused frame and compare its PNG with the cached one;
   * a difference replaces the entry and counts as `mismatched`. Omitted
   * verifies nothing. Read only with `cacheDirectory`.
   */
  cacheVerifyEvery?: number;

  /** Per-browser operation timeout in milliseconds; defaults to 240000. */
  timeoutMs?: number;

  /** Encoder wall-clock timeout in milliseconds; defaults to 1800000. */
  encoderTimeoutMs?: number;

  /** Maximum accumulated PNG bytes on disk; defaults to 8 GiB. */
  maxFrameBytes?: number;

  /** Maximum frame count before allocation; defaults to 1000000. */
  maxFrames?: number;

  /** Cancellation closes the browser and kills a running encoder before rejecting. */
  signal?: AbortSignal;

  /**
   * Synchronous progress after a written frame; a thrown error aborts capture.
   *
   * @evidence contracts/development/implementation.md#principled-implementation renderViewerVideo invokes this optional callback after a completed PNG write and capture timing update, supplying its actual zero-based index, scene seconds and cumulative PNG bytes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The callback reports progress independently of scene control, encoding and output acceptance; the renderer owns session and temporary-file cleanup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Progress is not export completion or review proof; callback returns are ignored, so asynchronous callback work is not awaited by the renderer.
   * @evidence contracts/development/common.md#meaningful-documentation The payload uses zero-based frame index, seconds at the render clock and cumulative written PNG bytes; synchronous throws enter the renderer's failure and cleanup path.
   * @evidence contracts/development/implementation.md#efficient-algorithms The renderer allocates one three-scalar payload per completed frame; callback execution time is caller-owned and adds to capture runtime.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing frame index, capture clock and accumulated byte counter without rereading files or recapturing pixels.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns resources captured by its callback; the render promise retains the options during execution and attempts browser/session/file cleanup after a synchronous failure, reporting cleanup failures.
   */
  onProgress?: (progress: {
    index: number;
    timeSeconds: number;
    bytes: number;
  }) => void;
}
