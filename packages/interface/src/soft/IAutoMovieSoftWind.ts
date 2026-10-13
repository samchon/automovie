import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A deterministic draught pushing on the panel.
 *
 * The gust is a **triangular** wave rather than a sinusoid on purpose. Only `+
 * − × ÷`, `Math.abs`, `Math.floor` and `Math.sqrt` are exactly specified by
 * IEEE-754 and ECMAScript alike; `Math.sin` is implementation-approximated, and
 * a curtain whose folds depend on which engine built the frame is not a
 * deterministic curtain.
 *
 * The draught is uniform over the panel and does not resolve the local surface
 * normal, so it billows a hanging curtain rather than modelling lift. That is
 * the bounded first tier, stated here instead of implied by a coefficient.
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
