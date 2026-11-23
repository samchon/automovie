import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieLoftSectionPhase } from "./IAutoMovieLoftSectionPhase";

/**
 * Cartesian readings of a prepared native section in its two-dimensional chart.
 *
 * AutoMovieLoftSectionNative prepares conic quarters or the declared G1 chain's readers
 * at a fixed station, then reads the requested orders at the same polar phase. Chart positions
 * use millimetres, phase uses radians, and the independent physical station uses
 * millimetres. These are surface partials, not arc-length derivatives. At a G1
 * chain join the starting arc supplies the second phase derivative; continuity
 * of that derivative is not promised. Every successful read owns fresh vectors.
 *
 * Native preparation and the requested reader own numerical admission and throw
 * AutoMovieLoftAdmissionError for rejected geometry. Exceptions from supplied
 * getters propagate unchanged. The interface adds no validator or fallback.
 *
 * @evidence contracts/development/design.md#principled-representation The point and phase methods both fix physical station; requesting either does not obtain unavailable station derivatives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Native preparation publishes this two-method curve capability while its phase and jet results use the shared section contracts consumed by loft source adapters and Human readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A G1 join retains its sided second derivative and failed source admission remains a failure; this contract does not assert a globally C2 section.
 * @evidence contracts/development/common.md#meaningful-documentation Defines local coordinates, independent parameters, derivative units, result ownership, preparation lifetime and the numerical admission owner.
 */
export namespace IAutoMovieLoftSectionNative {
  /**
   * Reusable point and phase readers over one owned numeric station preparation.
   *
   * Keeping the capability alive retains its fixed conic or chain records.
   * Releasing the capability releases that preparation; it owns no native handle.
   * Neither method mutates a prior result or requests physical station partials.
   *
   * @evidence contracts/development/design.md#principled-representation Both methods retain readers of the same fixed native source, so point inversion and a later tangent reading use the same original phase clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The curve factory exposes the two capabilities its callers combine without exposing preparation records or a mutable cache.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Point evaluation does not demand derivatives, and phase evaluation cannot substitute legacy geometry after native admission fails.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies input phase, output units, retained preparation, fresh results and propagated failure.
   */
  export interface ICurve {
    /**
     * Read the finite local point in millimetres at phi radians; numerical rejection throws from the native reader.
     */
    point(phi: number): AutoMovieVector2Tuple;

    /**
     * Read that same point and its first two phase partials at phi radians; numerical rejection throws from the native reader.
     */
    phase(phi: number): IAutoMovieLoftSectionPhase;
  }
}
