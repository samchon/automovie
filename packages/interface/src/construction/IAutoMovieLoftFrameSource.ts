import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";
import type { IAutoMovieViewAxisJet } from "./IAutoMovieViewAxisJet";

/** Data and callback contracts shared by the LoftFrameSource operations. */
export namespace IAutoMovieLoftFrameSource {
  /**
   * An actual source and independent numeric snapshot of its published layer
   * jet.
   */
  export interface ISource {
    /** Immutable actual source; its analytic jet callback must remain callable. */
    axis: IAutoMovieViewAxis.IAxis;

    /** Source station of this layer, mm. */
    station: number;

    /**
     * Independently copied finite source value, including at a singular
     * station.
     */
    frame: IAutoMovieLoftSectionFrame;

    /**
     * Independently copied station jet; null preserves a finite value whose
     * station derivatives are singular or nonfinite.
     */
    jet: IAutoMovieViewAxisJet.IJet | null;
  }
}
