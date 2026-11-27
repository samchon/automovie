import type { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition";

/** A sequence frame sample ready for a render host. */
export interface IAutoMovieSequenceRenderFrame {
  /** Zero-based output frame index. */
  index: number;

  /** Global output sample time in seconds. */
  timeSeconds: number;

  /** Frame path that the capture host should write. */
  path: string;

  /** Live shot id at this output frame. */
  shot: string;

  /** Live shot-local time in seconds. */
  shotTimeSeconds: number;

  /** Outgoing tail blended into this frame, or `null` for a hard cut. */
  blend: {
    /** Outgoing shot id. */
    shot: string;

    /** Outgoing shot-local time in seconds. */
    shotTimeSeconds: number;

    /**
     * Progress through the transition in `[0, 1)`; the incoming weight of a
     * `crossDissolve`.
     */
    alpha: number;

    /**
     * The transition's kind; a `fade` dips through black, weighing its shots as
     * `IAutoMovieTransition` states.
     */
    kind: IAutoMovieTransition["kind"];
  } | null;
}
