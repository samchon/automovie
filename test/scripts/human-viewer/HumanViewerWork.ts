/**
 * One iframe's latest display stage, reported without geometry or photographs.
 * Frame and source identity distinguish a preparing candidate from the last
 * committed generation. Wall-clock milliseconds locate observations; they
 * are not subtracted from the worker's independent performance clock.
 *
 * @evidence contracts/common.md#principled-implementation Source and frame identity retain stage ownership while scalar counters expose resource and request state.
 * @evidence contracts/common.md#clear-and-simple-design One telemetry record carries only progress and resource counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports actual request stages and renderer counters rather than document-specific estimates.
 * @evidence contracts/common.md#meaningful-documentation Defines identity, timing and the exclusion of model and photograph bytes.
 * @author Samchon
 */
export interface HumanViewerWork {
  /** Source modules loaded by this iframe. */
  revision: string;

  /** The host's candidate iframe ticket. */
  frame: string;

  /** Document currently being displayed. */
  doc: string;

  /** The outstanding operation, or idle after a completed frame. */
  phase: "loading" | "cache-read" | "build" | "numeric-reply" | "cache-write" | "prepare" | "draw" | "idle" | "failed";

  /** Wall-clock milliseconds at this transition. */
  at: number;

  /** Numerical replies the iframe still awaits. */
  pending: number;

  /** Geometries retained by the shared WebGL renderer. */
  geometries: number;

  /** Textures retained by the shared WebGL renderer. */
  textures: number;
}
