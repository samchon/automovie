/**
 * Caller-selected route/base/query, executable, frame rate, pixel dimensions, optional sequence target and MP4/PNG/JSON destinations. Values are capture instructions rather than demonstrated output; the unchanged CLI checks positive finite rate and positive even dimensions before canonical sequence planning/capture.
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
