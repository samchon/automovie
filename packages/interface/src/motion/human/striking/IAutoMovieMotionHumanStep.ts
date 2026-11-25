import type { IAutoMovieMotionHumanGuard } from "./IAutoMovieMotionHumanGuard";

/**
 * Fighting-stance footwork: steps that keep the stance, the foot on the side of
 * travel moving first and the other following to restore the stance without
 * crossing (IBA coaching manual pp. 36 to 39: forward, the lead foot then the
 * rear; back, the rear then the lead; sideways, the near foot then the far).
 *
 * Each step moves the whole stance by its length along the direction in the
 * body's line frame: the first foot swings in the first half of the step, the
 * second follows in the second, each on a minimum-jerk path lifted clear of the
 * floor, while the root carries the body on its own minimum-jerk profile and
 * the guard rides on the trunk. The step length defaults to half a stance
 * length (the kickboxing research's step share) and the step period to 0.35 s,
 * about three steps a second, inside the 2 to 3.5 steps a second of the
 * ring-movement reading (provisional). A supplied turn or changed lead plans a
 * different support schedule.
 */
export namespace IAutoMovieMotionHumanStep {
  /** Parameters. */
  export interface IParams {
    /** The direction in the stance's own frame. */
    direction: "forward" | "back" | "left" | "right";

    /**
     * How many steps, a whole number of at least 1; 1 when absent. Each step
     * takes the body's step period, 0.35 s at the reference hip and shorter on
     * a shorter leg (`step.PERIOD`, about three steps a second, provisional),
     * so the phrase lasts about `steps` times that.
     */
    steps?: number;

    /**
     * Each step's length, metres. A turning or lead-changing phrase may be in
     * place (zero). When absent, turns and lead changes stay in place and
     * straight steps travel half a stance length (`step.STEP_SHARE`, 1.2
     * shoulder widths long: {@link IAutoMovieMotionHumanStrikingStance}).
     */
    length?: number;

    /**
     * Heading change about world +Y, degrees across the phrase. Positive turns
     * toward the performer's left. Minus 90 to 90 degrees per step. Zero when
     * absent. The motion plan admits the per-step bound.
     */
    turn?: number;

    /** Lead to finish with on the last step. The current lead when absent. */
    lead?: "left" | "right";

    /**
     * Sporting guard carried through the phrase. Boxing is closer to the face.
     * Kickboxing uses the existing, more open guard. Absent uses the existing
     * guard.
     */
    guard?: IAutoMovieMotionHumanGuard.Style;
  }
}
