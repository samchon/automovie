/**
 * Caller-selected route/base/query, executable, frame rate, pixel dimensions, optional sequence target and MP4/PNG/JSON destinations. Values are capture instructions rather than demonstrated output; the unchanged CLI checks positive finite rate and positive even dimensions before canonical sequence planning/capture.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Explicit page, frame format and output destinations configure the canonical sequence planner; null target selects the page sequence id.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One flat options record separates caller configuration from compiled sequence metadata read at capture time.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not infer timing, substitute shots or hide unsupported numeric values.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state frame-rate and dimension units, nullable target meaning and each destination.
 */
export interface IAutoMoviePageSequenceRenderOptions {
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
