import type { IAutoMovieMotionHumanSeated } from "./IAutoMovieMotionHumanSeated";
import type { IAutoMovieMotionObstacleAperture } from "./IAutoMovieMotionObstacleAperture";

/**
 * Parameters of the opt-in `HumanTravelCarExit.getOut` law for a stationary car
 * with an already-open rear door. The performer enters seated on the bench and
 * ends standing outside the door.
 */
export namespace IAutoMovieMotionHumanTravelCarExit {
  /**
   * World geometry for the selected rear door. The law admits the seated entry
   * and checks passage; the author supplies the already-open door.
   */
  export interface IParams {
    /**
     * Rear bench in world metres, as read by HumanObject.seat, with its actual
     * depth.
     */
    bench: IAutoMovieMotionHumanSeated.ISeat & { depth: number };

    /** Rear cushion width, metres, from the same car's rear seat affordance. */
    width: number;

    /** The placed, clear opening of the already-open rear door. */
    through: IAutoMovieMotionObstacleAperture;

    /** The finite bearing face of the selected doorway's sill, when staged. */
    sill?: IParamsSill;

    /** Exterior ground elevation, world metres. */
    floor: number;

    /**
     * Seconds for the seated turn and both foot passages before the rise,
     * before tempo scaling. Positive. No natural value is defined: choose it
     * for the beat (provisional, missing).
     */
    turnSeconds: number;

    /** Gap from the sill and jambs, metres. Nonnegative. */
    clearance: number;

    /**
     * Distance outside the aperture plane to position the ankles, metres.
     * Positive.
     */
    landingDistance: number;

    /**
     * Additional spinal flexion at the end of the turn and at seat-off,
     * degrees. Nonnegative.
     */
    duckDegrees: number;

    /** Share of the turn by which to delay the trailing foot, in [0, 1). */
    stagger: number;

    /**
     * Share of each foot flight devoted to lifting and, separately, lowering,
     * in (0, 0.5).
     */
    liftShare: number;
  }

  /** The sill object of {@link IParams}. */
  export type IParamsSill = {
    /** The car's staged subject. */
    subject: string;
    /** Its sill affordance ID. */
    point: string;
  };
}
