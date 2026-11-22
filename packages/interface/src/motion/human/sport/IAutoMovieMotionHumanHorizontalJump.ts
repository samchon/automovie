/**
 * A long jump out of a run (#3871): the run is cut at the take-off foot's
 * footfall on the board, the jump's own push-off launches at a take-off
 * angle of about 21 degrees (`horizontalJump.ANGLE`), the flight is
 * ballistic, and both feet land in the sand with the heels at the authored
 * distance from the take-off line, absorb and rise.
 *
 * The take-off foot's toe may not pass the board's take-off line (a foul,
 * World Athletics TR30.1) and the distance may ask for no more horizontal
 * take-off speed than the run brings; either is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pit: Scene id of the jump pit; its `board` top's far edge is the take-off line and its `sand` top the landing surface. distance: The measured jump, metres from the take-off line to the nearest heel mark, perpendicular to the line; positive.
 * @evidence contracts/development/design.md#principled-representation pit: A scene id resolved by the law's prop reader. distance: Metres along the runway, the rules' measurement (TR30.2), the outcome taken as input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGymnastics.ts (HumanGymnastics.longJump, params); sport/horizontalJump.ts (horizontalJump.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No take-off speed or angle is authored: the run brings the speed and the angle is the law's measured one.
 */
export namespace IAutoMovieMotionHumanHorizontalJump {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The pit's id and the measured distance in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The distance is the outcome; the law refuses one the run cannot bring.
   */
  export interface IParams {
    /** Scene id of the jump pit; its `board` top's far edge is the take-off line and its `sand` top the landing surface. */
    pit: string;

    /** The measured jump, metres, positive, from the take-off line to the nearest heel mark, perpendicular to the line. */
    distance: number;
  }
}
