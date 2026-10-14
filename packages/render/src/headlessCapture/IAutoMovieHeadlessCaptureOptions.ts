import type { AutoMovieGuidePass } from "@automovie/interface";

import type { AutoMovieHeadlessWaitUntil } from "./AutoMovieHeadlessWaitUntil";
import type { IAutoMovieHeadlessFrameWriter } from "./IAutoMovieHeadlessFrameWriter";
import type { IAutoMovieHeadlessPage } from "./IAutoMovieHeadlessPage";

/**
 * Input of `createHeadlessCaptureAdapter`: the page to drive, the viewer route,
 * the hook and selector names, the guide passes, and where frames go.
 *
 * Optional fields fall back to the reference viewer's names: `#view`,
 * `#clips`, `__afSeek`, `__afPass`, `["beauty"]` and `load`.
 *
 * @evidence contracts/common.md#principled-implementation Each option is a value the adapter forwards to the page or uses to name files, and the defaults are the names the reference viewers define, so the common case needs only a page, a URL and a writer.
 * @evidence contracts/common.md#clear-and-simple-design One flat options record carries the whole session configuration, and every optional member has one default applied in one place by the adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The defaults are the reference viewer's published hook and element names rather than values for a particular test, and every one can be overridden.
 * @evidence contracts/common.md#meaningful-documentation The doc lists every default, and each member says what it controls, its default, and for `passes` the folding, ordering, file naming, return path and frame-size obligations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An options record holds values and runs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is read once at session creation and coordinates nothing to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The session closures keep this record, including `page` and `writeFrame`, for as long as the caller keeps the session; the page is released by the session's `close`.
 * @author Samchon
 */
export interface IAutoMovieHeadlessCaptureOptions {
  /** The page to drive; the session owns it once creation succeeds. */
  page: IAutoMovieHeadlessPage;

  /**
   * Fully resolved viewer URL, passed to `goto` unchanged. It must carry any
   * query parameter the viewer needs to hand frame timing to the seek hook,
   * such as `cap=1` for the reference viewers.
   */
  url: string;

  /** Selector of the element each screenshot captures; `#view` by default. */
  viewSelector?: string;

  /**
   * Selector hidden with `display:none!important` before capture so viewer
   * controls stay out of frames; `#clips` by default, and `null` hides
   * nothing.
   */
  hideSelector?: string | null;

  /**
   * Name of the page global that moves the viewer to a time in seconds;
   * `__afSeek` by default. The adapter does not await anything the hook
   * returns, so the hook must finish rendering synchronously.
   */
  seekFunction?: string;

  /**
   * Guide passes to capture for every frame, `["beauty"]` by default.
   *
   * Repeated names fold to their first position and the list must not be
   * empty. Each frame seeks once, then captures every pass in order and writes
   * it to `guidePassFrameName(index, pass)`: `beauty` keeps the plain
   * `frame_00042.png` and other passes insert their name, as
   * `frame_00042.depth.png`. When any pass other than `beauty` is requested the
   * adapter switches passes through `passFunction`; a beauty-only list never
   * waits for or calls it, so viewers without a pass hook still work.
   *
   * The pass frames are raw PNG sequences that no encoder rescales, unlike the
   * beauty video that ffmpeg `-s` conforms to the render spec. Their size is
   * whatever the `viewSelector` element measures, so the host must size the
   * capture surface to the render spec, for example with the reference
   * viewer's `w` and `h` URL parameters, or the guide frames will not match
   * the pose sidecar's aspect or the beauty video.
   */
  passes?: readonly AutoMovieGuidePass[];

  /**
   * Name of the page global that switches the rendered pass; `__afPass` by
   * default. Waited for and called only when `passes` contains a pass other
   * than `beauty`.
   */
  passFunction?: string;

  /** Navigation milestone `goto` waits for; `load` by default. */
  waitUntil?: AutoMovieHeadlessWaitUntil;

  /** Persists each captured PNG; see `IAutoMovieHeadlessFrameWriter`. */
  writeFrame: IAutoMovieHeadlessFrameWriter;
}
