/**
 * A field event's throw: the shot, the discus or the hammer from a throwing
 * circle, or the javelin from the end of its runway.
 *
 * The thrower holds the implement as the throw enters. In a circle the feet
 * stand in the power position across it and the body turns over them
 * (`fieldThrow.EVENTS`: half a turn for the shot, one and a half for the
 * discus, three and a half for the hammer); the javelin is cut from a run at
 * the block foot's footfall. The implement leaves the hand at the event's
 * release angle with the speed that lands it at the authored distance (the
 * recorded result), measured as the rules measure it. A throw whose feet stand
 * outside the circle or past the arc (a foul), or whose distance needs more
 * release speed than the event's measured ceiling, is refused.
 */
export namespace IAutoMovieMotionHumanFieldThrow {
  /** The throwing events. */
  export type Event = "shot" | "discus" | "hammer" | "javelin";

  /** Parameters. */
  export interface IParams {
    /** The throw. */
    event: Event;

    /** Scene id of the implement the throwing hand holds. */
    implement: string;

    /**
     * Scene id of the throwing circle or the javelin runway
     * (`createThrowingCircle`).
     */
    area: string;

    /**
     * The recorded result, metres, positive, from the circle's inside edge or
     * the arc to the landing mark.
     */
    distance: number;
  }
}
