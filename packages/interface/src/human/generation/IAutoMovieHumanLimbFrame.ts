import type { IAutoMovieLoftSectionFrame } from "../../construction/IAutoMovieLoftSectionFrame";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Sampled limb section frames and corresponding spline/lift coefficient arrays.
 * Runtime construction and admission remain with AutoMovieHumanLimbFrame in
 * Human.
 */
export namespace IAutoMovieHumanLimbFrame {
  /** One section sampled at a station: its frame and its ring of world points. */
  export interface ISample {
    /** Station along the chain, mm, increasing toward the parent. */
    station: number;

    /** The section's plane. */
    frame: IAutoMovieLoftSectionFrame;

    /** One world point per control point, in phase order. */
    ring: AutoMovieVector3Tuple[];
  }

  /**
   * Closed section coefficients and corresponding lift coefficients recovered
   * from a ring in its own frame. The two arrays retain their source phase
   * correspondence and physical chart units.
   */
  export type IControlsResult = {
    /**
     * Section's packed closed-curve coefficients in its physical local chart,
     * millimetres.
     */
    coefficients: number[];
    /**
     * Material-frame lift coefficients carried with the section, in the owning
     * curve's declared parameter.
     */
    lift: number[];
  };
}
