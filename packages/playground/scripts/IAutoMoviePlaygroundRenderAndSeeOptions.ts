import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Caller-selected route/base/query, Chrome path, positive capture interval/rate, pixel dimensions, target, artifact destinations and guide passes for the existing render CLI. CLI parsing checks finite positivity/even dimensions and canonical pass names; direct function callers receive the canonical render/capture owner's validation rather than validation by this erased shape.
 *
 * @evidence contracts/common.md#principled-implementation Named dimensions, paths and canonical render/sequence references expose the existing typed capture boundary without a second protocol.
 * @evidence contracts/common.md#clear-and-simple-design The original CLI and capture function consume this record; rendering, page capture and output admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An erased type does not validate physical anatomy, resource existence, pixels or successful encoding; the comment separates requested values from observations.
 * @evidence contracts/common.md#meaningful-documentation The comment names the actual consumer, units, ownership, cost and interpretation limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased shape declarations perform no capture, numerical sampling or pixel iteration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased shape declarations own no cache or repeated runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Erased shape declarations acquire no native handle; runtime owners release browser/page/encoder resources.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundRenderAndSeeOptions {
  /** Vite page loaded for the capture. */
  page: string;
  /** Page-specific query parameters added before capture controls. */
  query: string;
  /** Base URL of the running playground server. */
  base: string;
  /** Chrome or Chromium executable used for the headless session. */
  chrome: string;
  /** Film interval captured from the page, in seconds. */
  durationSeconds: number;
  /** Frame sampling rate used by capture and encoding. */
  fps: number;
  /** Output frame width in pixels. */
  width: number;
  /** Output frame height in pixels. */
  height: number;
  /** Stable render target identity recorded in the result. */
  target: string;
  /** Destination of the encoded H.264 MP4. */
  outputPath: string;
  /** Directory receiving the source PNG sequence. */
  frameDir: string;
  /** Destination of the machine-readable capture artifact. */
  jsonPath: string;
  /** Guide passes captured per frame (#1165); defaults to plain beauty. */
  passes: AutoMovieGuidePass[];
}
