import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether every joint of a displayed motion stays inside its anatomical range
 * of motion at every instant.
 *
 * A body cannot bend an elbow backward or turn a knee sideways, however smooth
 * and collision-free the result looks. The reading takes the displayed pose's
 * clinical joint angles at each grid instant and measures each joint against
 * the humanoid range table the pose gate enforces (`DEFAULT_HUMANOID_ROM`), by
 * the gate's own scan (`scanJointRom`): an angle outside its interval
 * overshoots by its distance to the nearer bound, an angle on an axis the joint
 * does not have by its whole magnitude, and a ball joint's combined flexion and
 * abduction by what it exceeds the swing cone. A joint the table does not list
 * is unconstrained.
 */
export namespace IAutoMovieMotionHumanAuditRange {
  /**
   * A motion as this audit reads it: a person's displayed pose at any film
   * second. `HumanPerformance` is one.
   */
  export interface IPosed {
    /** The motion's length, film seconds. */
    readonly duration: number;

    /**
     * A person's displayed pose.
     *
     * @param subject The person.
     * @param seconds Film seconds, within the motion.
     * @returns The pose, joints in clinical degrees.
     */
    pose(subject: string, seconds: number): IAutoMoviePose;
  }

  /** What the reading found. */
  export interface IResult {
    /**
     * The farthest a joint stands past its range, degrees, with the bone and
     * the axis (`flexion`, `abduction`, `twist` or `swing`); `Infinity` for a
     * non-finite angle.
     */
    overshoot: IAutoMovieMotionHumanAuditMeasure;

    /**
     * The part of the grid's instants at which some joint is past its range, in
     * [0, 1].
     */
    share: number;
  }
}
