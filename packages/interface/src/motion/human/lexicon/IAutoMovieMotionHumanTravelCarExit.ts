import type { IAutoMovieMotionHumanSeated } from "../everyday/IAutoMovieMotionHumanSeated";
import type { IAutoMovieMotionObstacleAperture } from "../perform/IAutoMovieMotionObstacleAperture";

/**
 * Parameters of the opt-in `HumanTravelCarExit.getOut` law for a stationary
 * car with an already-open rear door. The performer enters seated on the
 * bench and ends standing outside the door.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the opening, the entered support and the standing outcome.
 * @evidence contracts/development/design.md#principled-representation A placed bench and an opening in world metres, with an authored exterior floor elevation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The registered getOut planner consumes these parameters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing seat frame and obstacle aperture types.
 */
export namespace IAutoMovieMotionHumanTravelCarExit {
  /**
   * World geometry for the selected rear door. The law admits the seated
   * entry and checks passage; the author supplies the already-open door.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the seat, raw cushion width, selected opening, exterior floor, phase timing, landing position and extra flexion.
   * @evidence contracts/development/design.md#principled-representation Bench extent consists of its canonical seat frame, explicit depth and cushion width. The aperture describes its clear opening in the same frame as the exterior floor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Consumed by HumanTravelCarExit.getOut through the registered action parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Width comes from the physical seat affordance; it is independent of performer size and car class.
   */
  export interface IParams {
    /** Rear bench in world metres, as read by HumanObject.seat, with its actual depth. */
    bench: IAutoMovieMotionHumanSeated.ISeat & { depth: number };

    /** Rear cushion width, metres, from the same car's rear seat affordance. */
    width: number;

    /** The placed, clear opening of the already-open rear door. */
    through: IAutoMovieMotionObstacleAperture;

    /** Exterior ground elevation, world metres. */
    floor: number;

    /** Seconds for the seated turn and both foot passages before the rise, before tempo scaling. Positive. */
    turnSeconds: number;

    /** Gap from the sill and jambs, metres. Nonnegative. */
    clearance: number;

    /** Distance outside the aperture plane to position the ankles, metres. Positive. */
    landingDistance: number;

    /** Additional spinal flexion at the end of the turn and at seat-off, degrees. Nonnegative. */
    duckDegrees: number;

    /** Share of the turn by which to delay the trailing foot, in [0, 1). */
    stagger: number;

    /** Share of each foot flight devoted to lifting and, separately, lowering, in (0, 0.5). */
    liftShare: number;
  }
}
