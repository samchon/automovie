import type { IAutoMovieRecoveryScalarWindow } from "./IAutoMovieRecoveryScalarWindow";

/**
 * Select complete saved scalar slabs intersecting a declared physical window.
 * Scalars are millimetres along the observation's normalized sweep direction.
 * Positive overlap uses before < upper and after > lower; merely touching the
 * window does not select a slab. Endpoints are never moved or newly inserted.
 * The retained whole slabs may extend beyond the window, and report those
 * bounds.
 */

export namespace IAutoMovieRecoveryScalarIntervalsSelectionOperation {
  /**
   * Select complete saved scalar slabs intersecting a declared physical window.
   * Scalars are millimetres along the observation's normalized sweep direction.
   * Positive overlap uses before < upper and after > lower; merely touching the
   * window does not select a slab. Endpoints are never moved or newly inserted.
   * The retained whole slabs may extend beyond the window, and report those
   * bounds.
   */

  export type Operation = (
    levelsMm: readonly number[],
    order: readonly number[],
    windowMm?: Readonly<IAutoMovieRecoveryScalarWindow>,
  ) => {
    /**
     * Selected adjacent saved-plane interval ordinals in deterministic source
     * order.
     */
    intervals: number[];

    /**
     * Requested physical scalar window [lower,upper], or null when no window
     * restricts selection.
     */
    windowMm: [number, number] | null;

    /**
     * Bounds of the full selected slab population in millimetres, or null for
     * an empty selection.
     */
    wholeSlabBoundsMm: [number, number] | null;

    /** Number of complete source intervals outside the requested scalar window. */
    excludedIntervals: number;
  };
}
