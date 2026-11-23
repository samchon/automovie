/**
 * Legal travel endpoints derived from an articulation's authored kind and
 * limits.
 */
export namespace IAutoMovieAffordanceTravelRange {
  /**
   * Fresh mutable inclusive interval from affordanceTravelRange. Rotary
   * hinge/knob/crank/wheel coordinates use degrees; slider/button/pedal/trigger
   * coordinates use metres. The producer assumes an admitted articulation and
   * performs no kind, finiteness or bound-order admission.
   *
   * A wheel with travel spans minus travel through travel. A crank without
   * travel is unbounded at both ends. Hinge/knob/slider use minus reverse when
   * supplied, otherwise zero, as the lower endpoint; all remaining finite upper
   * endpoints are travel or zero when absent.
   */
  export type IResult = {
    /**
     * Inclusive lower travel in the articulation's unit; null only for an
     * unbounded crank.
     */
    minimum: number | null;

    /**
     * Inclusive upper travel in the articulation's unit; absent travel becomes
     * zero except for the unbounded crank.
     */
    maximum: number | null;
  };
}
