import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Authoring inputs for walking through a yielding or resisting medium: wading
 * in water, trudging through snow, sand or mud, and leaning into a steady
 * wind.
 */
export namespace IAutoMovieMotionHumanMedium {
  /** The medium walked through. */
  export type Kind = "water" | "snow" | "sand" | "mud";

  /** The medium on the walk's path. */
  export interface IMedium {
    /** The medium. */
    kind: Kind;

    /**
     * Water's surface above the ground, or the depth of the snow, sand or mud
     * layer over the firm ground a stance foot sinks through to, metres.
     */
    depth: number;

    /**
     * Seconds a foot stuck in mud takes to pull free at each toe-off; mud only,
     * zero when absent.
     */
    hold?: number;
  }

  /** A walk through a medium, optionally into a steady wind. */
  export interface IWalkParams {
    /** World target of the walk, metres. */
    to: IAutoMovieVector3;

    /** World points the walk passes on the way, metres. */
    via?: IAutoMovieVector3[];

    /** The medium on the path; rigid ground when absent. */
    medium?: IMedium;

    /**
     * The steady horizontal wind force on the body, world newtons; none when
     * absent.
     */
    wind?: IAutoMovieVector3;
  }
}
