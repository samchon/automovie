/**
 * A long jump out of a run: the run is cut at the take-off foot's footfall on
 * the board, the jump's own push-off launches at a take-off angle of about 21
 * degrees (`horizontalJump.ANGLE`), the flight is ballistic, and both feet land
 * in the sand with the heels at the authored distance from the take-off line,
 * absorb and rise.
 *
 * The take-off foot's toe may not pass the board's take-off line (a foul, World
 * Athletics TR30.1) and the distance may ask for no more horizontal take-off
 * speed than the run brings; either is refused.
 */
export namespace IAutoMovieMotionHumanHorizontalJump {
  /** Parameters. */
  export interface IParams {
    /**
     * Scene id of the jump pit; its `board` top's far edge is the take-off line
     * and its `sand` top the landing surface.
     */
    pit: string;

    /**
     * The measured jump, metres, positive, from the take-off line to the
     * nearest heel mark, perpendicular to the line.
     */
    distance: number;
  }
}
