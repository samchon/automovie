/**
 * Caller-selected route/base/query, executable, frame rate, pixel dimensions, optional sequence target and MP4/PNG/JSON destinations. Values are capture instructions rather than demonstrated output; the unchanged CLI checks positive finite rate and positive even dimensions before canonical sequence planning/capture.
 *
 * @evidence contracts/common.md#principled-implementation Named dimensions, paths and canonical render/sequence references expose the existing typed capture boundary without a second protocol.
 * @evidence contracts/common.md#clear-and-simple-design The original CLI and capture function consume this record; rendering, page capture and output admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An erased type does not validate physical anatomy, resource existence, pixels or successful encoding; the comment separates requested values from observations.
 * @evidence contracts/common.md#meaningful-documentation Specifies route/query/base, executable, sampling rate, pixel dimensions, null target fallback and caller-owned MP4/PNG/JSON destinations, with CLI numeric checks distinguished from an erased type's lack of runtime admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased shape declarations perform no capture, numerical sampling or pixel iteration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased shape declarations own no cache or repeated runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Erased shape declarations acquire no native handle; runtime owners release browser/page/encoder resources.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundSequenceRenderOptions {
  /** Vite page exposing the sequence capture hooks. */
  page: string;

  /** Page-specific query parameters added before capture controls. */
  query: string;

  /** Base URL of the running playground server. */
  base: string;

  /** Chrome or Chromium executable used for the headless session. */
  chrome: string;

  /** Frame sampling rate used by the sequence render plan. */
  fps: number;

  /** Output frame width in pixels. */
  width: number;

  /** Output frame height in pixels. */
  height: number;

  /** Explicit render target, or the page's sequence identity when omitted. */
  target: string | null;

  /** Destination of the encoded H.264 MP4. */
  outputPath: string;

  /** Directory receiving the source PNG sequence. */
  frameDir: string;

  /** Destination of the machine-readable capture artifact. */
  jsonPath: string;
}
