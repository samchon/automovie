/**
 * One iframe's latest display stage, reported without geometry or photographs.
 * Frame and source identity distinguish a preparing candidate from the last
 * committed generation. Wall-clock milliseconds locate observations; they
 * are not subtracted from the worker's independent performance clock.
 *
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
  phase:
    | "loading"
    | "cache-read"
    | "build"
    | "numeric-reply"
    | "cache-write"
    | "prepare"
    | "draw"
    | "idle"
    | "failed";

  /** Latest actual numerical owner completion, when this transition reports one. */
  completed?: string;

  /** Worker monotonic milliseconds from request start; not added to page spans. */
  completionElapsedMs?: number;

  /** Worker monotonic milliseconds since its preceding completion. */
  completionStageMs?: number;

  /** Wall-clock milliseconds at this transition. */
  at: number;

  /** Numerical replies the iframe still awaits. */
  pending: number;

  /** Geometries retained by the shared WebGL renderer. */
  geometries: number;

  /** Textures retained by the shared WebGL renderer. */
  textures: number;

  /** Documents the page keeps drawn-ready. */
  residents: number;

  /** Bytes of arrays those residents keep alive, the quantity their cache is bounded by. */
  residentBytes: number;
}
