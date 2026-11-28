import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/** Saved-event admission results consumed by contour document preparation. */
export namespace IAutoMovieAdmitContourEvents64 {
  /**
   * Copied events and aligned admission reasons. A missing or reversed saved
   * bracket prevents locating an event and throws. Recognized local defects
   * stay attached to events within valid brackets. Every occurrence of a
   * duplicate name receives a reason.
   */
  export type IResult = {
    /**
     * New records in input order, including locally unsupported events. The
     * reader deduplicates incidence and copies dense terminal triples. Supply
     * integer loop ordinals and finite terminal coordinates.
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
