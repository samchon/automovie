import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieLoftSectionPhase } from "./IAutoMovieLoftSectionPhase";

/**
 * Cartesian readings of a prepared native section in its two-dimensional chart.
 *
 * AutoMovieEngineLoftSectionNative prepares conic quarters or the declared G1 chain's
 * readers at a fixed station, then reads the requested orders at the same polar
 * phase. Chart positions use millimetres, phase uses radians, and the
 * independent physical station uses millimetres. These are surface partials,
 * not arc-length derivatives. At a G1 chain join the starting arc supplies the
 * second phase derivative; continuity of that derivative is not promised. Every
 * successful read owns fresh vectors.
 *
 * Native preparation and the requested reader own numerical admission and throw
 * AutoMovieEngineLoftAdmissionError for rejected geometry. Exceptions from supplied
 * getters propagate unchanged. The interface adds no validator or fallback.
 */
export namespace IAutoMovieLoftSectionNative {
  /**
   * Reusable local point and phase capability for one prepared native station.
   * Both methods share the same conic or split-chain preparation, evaluate
   * polar radians and return fresh local vectors. Physical-station derivatives
   * require a separate station preparation.
   */
  export interface ICurve {
    /**
     * Read the local [u, v] point in millimetres at polar phase phi in radians.
     * The native reader throws when the requested point cannot be admitted.
     */
    point(phi: number): AutoMovieVector2Tuple;

    /**
     * Read the same point plus first and second phase derivatives at polar
     * phase phi in radians. The starting arc supplies the sided second
     * derivative at a split-chain join. The native reader throws when it cannot
     * admit the requested phase.
     */
    phase(phi: number): IAutoMovieLoftSectionPhase;
  }
}
