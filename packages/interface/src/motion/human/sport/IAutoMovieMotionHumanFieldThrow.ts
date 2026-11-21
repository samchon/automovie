/**
 * A field event's throw (#3872): the shot, the discus or the hammer from a
 * throwing circle, or the javelin from the end of its runway.
 *
 * The thrower holds the implement as the throw enters. In a circle the
 * feet stand in the power position across it and the body turns over them
 * (`fieldThrow.EVENTS`: half a turn for the shot, one and a half for the
 * discus, three and a half for the hammer); the javelin is cut from a run
 * at the block foot's footfall. The implement leaves the hand at the
 * event's release angle with the speed that lands it at the authored
 * distance (the recorded result), measured as the rules measure it. A
 * throw whose feet stand outside the circle or past the arc (a foul), or
 * whose distance needs more release speed than the event's measured
 * ceiling, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation event: The throw. implement: Scene id of the held implement. area: Scene id of the throwing circle or the javelin runway (`createThrowingCircle`). distance: The recorded result, metres from the circle's inside edge or the arc to the landing mark.
 * @evidence contracts/development/design.md#principled-representation event: A closed union. implement and area: scene ids. distance: Metres along the throw, the outcome taken as input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGymnastics.ts (HumanGymnastics.fieldThrow, params); sport/fieldThrow.ts (fieldThrow.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No release speed is authored: it follows from the distance and is bounded by the event's measured ceiling.
 */
export namespace IAutoMovieMotionHumanFieldThrow {
  /**
   * The throwing events.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four events.
   * @evidence contracts/development/design.md#principled-representation A closed union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The events the law's table covers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Event = "shot" | "discus" | "hammer" | "javelin";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The event, two scene ids and a distance in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The distance is the outcome; the law refuses one the event cannot reach.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach, foul and speed refusals.
   */
  export interface IParams {
    /** The throw. */
    event: Event;

    /** Scene id of the implement the throwing hand holds. */
    implement: string;

    /** Scene id of the throwing circle or the javelin runway (`createThrowingCircle`). */
    area: string;

    /** The recorded result, metres from the circle's inside edge or the arc to the landing mark.
     * Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    distance: number;
  }
}
