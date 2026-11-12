import { DEFAULT_HUMANOID_ROM, scanJointRom } from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * Whether every joint of a displayed motion stays inside its anatomical
 * range of motion at every instant.
 *
 * A body cannot bend an elbow backward or turn a knee sideways, however
 * smooth and collision-free the result looks. The reading takes the
 * displayed pose's clinical joint angles at each grid instant and measures
 * each joint against the humanoid range table the pose gate enforces
 * (`DEFAULT_HUMANOID_ROM`), by the gate's own scan (`scanJointRom`): an
 * angle outside its interval overshoots by its distance to the nearer bound,
 * an angle on an axis the joint does not have by its whole magnitude, and a
 * ball joint's combined flexion and abduction by what it exceeds the swing
 * cone. A joint the table does not list is unconstrained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect, the table and the scan it reads by, and how each overshoot is measured.
 * @evidence contracts/development/implementation.md#principled-implementation The pose gate's own fault scan over the motion's instants, so the audit and the gate cannot judge a joint by different rules.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk over the grid and each instant's joints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint, axis or instant is exempt and no tolerance is added; a non-finite angle reads as infinitely far.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in grid frames and joints.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `scanJointRom` and range table rather than restating a limit.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditRange {
  /**
   * A motion as this audit reads it: a person's displayed pose at any film
   * second. `HumanPerformance` is one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and which producer satisfies it.
   * @evidence contracts/development/design.md#principled-representation Clinical angles live on the pose, not on the resolved bones the other audits read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, a structural subset of `HumanPerformance`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's pose; no cast or optional member.
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

  /**
   * What the reading found.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and what it is read on.
   * @evidence contracts/development/design.md#principled-representation The worst overshoot and the one share it cannot tell.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, each asserted by the audit's test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IResult {
    /** The farthest a joint stands past its range, degrees, with the bone and the axis (`flexion`, `abduction`, `twist` or `swing`); `Infinity` for a non-finite angle. */
    overshoot: IAutoMovieMotionHumanAuditMeasure;

    /** The part of the grid's instants at which some joint is past its range, in [0, 1]. */
    share: number;
  }

  /**
   * Read one person's joints over a motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param rate Grid samples per second.
   * @returns The reading.
   * @throws {Error} When the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation Every joint of every instant goes through the gate's scan against the table's constraint for its bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two nested loops and one callback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A fault without a distance is a non-finite angle and reads as `Infinity`, never as zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scan per joint per instant, no allocation beyond the grid.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid is `IAutoMovieMotionHumanAuditMotion.grid`, the scan the engine's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function measure(
    motion: IPosed,
    subject: string,
    rate: number = 24,
  ): IResult {
    const out: IResult = {
      overshoot: { value: 0, seconds: 0, where: "none" },
      share: 0,
    };
    const frames: number[] = IAutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    );
    let past: number = 0;
    for (const t of frames) {
      let faulted: boolean = false;
      for (const joint of motion.pose(subject, t).joints) {
        const constraint: IAutoMovieJointConstraint | undefined =
          DEFAULT_HUMANOID_ROM[joint.bone];
        if (constraint === undefined) continue;
        scanJointRom(
          joint,
          constraint,
          (
            part: scanJointRom.Part,
            _actual: number,
            overshoot: number | undefined,
          ): void => {
            const value: number = overshoot ?? Number.POSITIVE_INFINITY;
            faulted = true;
            if (value > out.overshoot.value)
              out.overshoot = {
                value,
                seconds: t,
                where: `${joint.bone} ${part}`,
              };
          },
        );
      }
      if (faulted) past++;
    }
    out.share = past / frames.length;
    return out;
  }
}
