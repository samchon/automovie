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

    /** Incoming weight in `[0, 1)`. */
    alpha: number;
  } | null;
}
