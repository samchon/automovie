import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/** Saved-event admission results consumed by contour document preparation. */
export namespace IAutoMovieAdmitContourEvents64 {
  /**
   * Copied saved events and aligned local admission failures. A missing saved
   * bracket cannot be located and refuses globally. Within a known bracket,
   * invalid terminals, coordinates, incidence or names remain local reasons; no
   * replacement terminal, contour association or critical coordinate is
   * inferred. Duplicate names quarantine every participant rather than
   * selecting one owner.
   */
  export type IResult = {
    /**
     * New records in input order, including unsupported events. Incidence
     * arrays contain only unique valid local loop ordinals; finite terminal
     * triples are cloned and unusable terminals become null.
     */
    events: IAutoMovieContourLoft64.IEvent[];

    /**
     * One entry per events record. Undefined means admission found no local
     * defect; a string combines all local reasons and does not imply the event
     * was omitted from events.
     */
    unsupported: (string | undefined)[];
  };
}
