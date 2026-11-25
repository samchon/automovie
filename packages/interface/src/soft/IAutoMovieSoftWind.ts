import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A deterministic draught pushing on the panel.
 *
 * The gust uses a triangular wave evaluated from the fixed-step start time,
 * with no accumulated oscillator state.
 *
 * The draught is uniform over the panel and does not resolve the local surface
 * normal, so it billows a hanging curtain rather than modelling lift. That is
 * the bounded first tier, stated here instead of implied by a coefficient.
 */
export interface IAutoMovieSoftWind {
  /** Direction the draught pushes; non-zero and need not be unit. */
  direction: IAutoMovieVector3;

  /** Steady component of the draught's acceleration in m/s²; may be negative. */
  acceleration: number;

  /** Amplitude of the triangular gust in m/s²; `>= 0`. */
  gustAcceleration: number;

  /** Gust frequency in Hz; `>= 0`, where `0` holds the gust at its peak. */
  gustHz: number;
}
