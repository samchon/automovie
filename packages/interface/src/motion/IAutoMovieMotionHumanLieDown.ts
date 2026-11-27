import type { IAutoMovieMotionHumanJoints } from "./IAutoMovieMotionHumanJoints";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Lying down on the floor from standing into a position: supine, prone, or on
 * the left or right side. Entered on the knees or crouched over the hands, as a
 * crawl ends, the body goes from the posture it displays through the route's
 * postures after the kneel; any other base is refused (`floorEntry`).
 *
 * The movement passes through the floor postures people use to get down
 * (VanSant 1988, Phys Ther 68:185, codes the components of the reverse rise):
 * to lie on the back the body sits down onto the floor and rolls back; to lie
 * face down it kneels, goes onto hands and knees and lowers itself forward; to
 * lie on a side it lies on its back and rolls onto that side. Each posture is a
 * set of joint angles and a whole-body tilt (`POSES`, provisional), passed
 * through in joint space on minimum-jerk progress. At every second the body
 * rests on the floor: the root's height puts the lowest point of the body's
 * collision shapes on it (`knockdown.rest`), and the pelvis stays over the
 * place it stood on, so the body pivots about it. Each phase takes `PHASE`
 * seconds (provisional), scaled by the manner's tempo; the position is then
 * held `hold` seconds. Events: `getDown` at the start, the arrival at each
 * posture on the route (`seatContact`, `kneeContact`, `handsDown`, `supine`,
 * `prone`, `lateral`) and `settled`.
 *
 * Not yet: lying on a bed or a sofa (A2 support frames, A8 `surface`), the
 * recovery position, sleep with seeded position changes (Skarpsno et al. 2017;
 * De Koninck et al. 1992), rolling over and rising from a bed; the feet are not
 * planted while the body goes down, so they slide.
 */
export namespace IAutoMovieMotionHumanLieDown {
  /** Parameters. */
  export interface IParams {
    /** The position; `supine` when absent. */
    kind?: IAutoMovieMotionHumanLieDown.Position;

    /** Seconds held lying, at least 0; 2 when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** A lying position. */
  export type Position =
    | "supine"
    | "prone"
    | "lateralLeft"
    | "lateralRight"
    | "sitLong"
    | "sitCrossed"
    | "sitSide";

  /** A floor posture: the whole body's tilt and its joints. */
  export interface IPose {
    /** Forward tilt, degrees. */
    pitch: number;

    /** Tilt toward the right, degrees. */
    roll: number;

    /** Clinical joint angles, degrees. */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }
}
