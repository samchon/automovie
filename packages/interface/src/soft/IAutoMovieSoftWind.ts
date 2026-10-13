import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A deterministic draught pushing on the panel.
 *
 * The gust uses a triangular wave evaluated from the fixed-step start time, with no accumulated oscillator state.
 *
 * The draught is uniform over the panel and does not resolve the local surface normal, so it billows a hanging curtain rather than modelling lift. That is the bounded first tier, stated here instead of implied by a coefficient.
 *
 * @evidence contracts/common.md#principled-implementation windAxis normalizes the declared nonzero direction and windAcceleration adds a triangular wave, 4 * abs(fract(gustHz * time) - 0.5) - 1, to the steady acceleration.
 * @evidence contracts/common.md#clear-and-simple-design One uniform acceleration vector and scalar wave parameters express the implemented draught without introducing a spatial fluid field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The force is not normal-dependent lift or drag; zero frequency holds the positive gust peak rather than silently disabling its amplitude.
 * @evidence contracts/common.md#meaningful-documentation Members state normalized-direction input, acceleration units, nonnegative gust amplitude/frequency and the zero-frequency behavior.
 * @author Samchon
 */
export interface IAutoMovieSoftWind {
  /** Direction the draught pushes; non-zero and need not be unit. */
  direction: IAutoMovieVector3;

  /**
   * Steady component of the draught's acceleration in m/s²; may be negative.
   */
  acceleration: number;

  /** Amplitude of the triangular gust in m/s²; `>= 0`. */
  gustAcceleration: number;

  /** Gust frequency in Hz; `>= 0`, where `0` holds the gust at its peak. */
  gustHz: number;
}
