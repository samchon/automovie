import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";

/**
 * A law's arm goals fitted along the action's course, each second's fit
 * continuing the swivel and the branch the course chose before it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, along what and why.
 * @evidence contracts/development/design.md#principled-representation The arms of a second are the fit of its goals continued from the course's last frame instant, a function of the second alone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the laws that state their arms as goals at each second.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fits are the posture resolver's own, continued as the planner's course continues them (`AutoMovieMotionHumanArmCourse`).
 */
export namespace AutoMovieMotionHumanArmChain {
  /**
   * The posture at a second with its arm goals fitted along the course and
   * written as joints.
   *
   * A goal fitted alone at each second takes the best of the arm's swivels
   * for that second, and where two swivels trade places the arm jumps
   * between two seconds a frame apart (a bending free arm's elbow moved
   * 0.2 m between the descent's shares 0.7475 and 0.7474). The course is
   * therefore fitted on the planner's frame grid from the action's start,
   * each instant continuing the swivel, the branch and the arms the instant
   * before chose (`IAutoMovieSwivelNear`), the per-frame coherence a game's
   * IK keeps; a second is fitted continuing the grid instant at or before
   * it. A continued fit holds its hand on the goal and moves the swivel at
   * most one articulation step from its seed (`hingedSwivelNear`), so the
   * elbow follows its hint smoothly and never across a ridge of the room.
   * The grid's fits are the course's own, laid once from the start as a
   * second past them is first read, so a second's arms do not depend on the
   * order the seconds are read in.
   *
   * @param body The body.
   * @param duration The action's duration, seconds.
   * @param posture The law's posture at a second, its arms as goals.
   * @param sides The arms to fit along the course.
   * @returns The posture at a second, those arms written as joints with their goals removed; given the law's posture at that second already read, it is fitted instead of reading it again.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the defect, the grid, the continuation and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Continuation along a path, the per-frame seeding of an analytic IK by the frame before, as `AutoMovieMotionHumanArmCourse` fits a hold; the grid is the planner's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain of continued fits on the grid and one continued fit per second read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every second is fitted to its own goals; the grid only names the swivel it continues.
   * @evidence contracts/development/implementation.md#efficient-algorithms One continued fit per second read, a refinement about a seed in place of the cold swivel sweep, and one per grid instant up to the latest second read, laid once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid instants' seeds are the course's own record, read by every second after them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one seed record per grid instant of the action, released with the plan.
   */
  export function continued(
    body: IAutoMovieMotionHumanBody,
    duration: number,
    posture: (seconds: number) => IAutoMovieMotionHumanPosture,
    sides: readonly AutoMovieHumanSide[] = ["left", "right"],
  ): (seconds: number, now?: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanPosture {
    const step: number = AutoMovieMotionHumanArmCourse.STEP;
    const last: number = Math.floor(duration / step + 1e-9);
    const course: IAutoMovieMotionHumanResolveHumanPosture.INear[] = [];

    // A second's goals fitted continuing the seeds given, and the seeds the
    // fit chose; a fit that names no seed leaves the one it continued.
    const fit = (
      at: IAutoMovieMotionHumanPosture,
      near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    ): { posture: IAutoMovieMotionHumanPosture; near: IAutoMovieMotionHumanResolveHumanPosture.INear } => {
      const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = resolveHumanPosture.seeded(
        body,
        at,
        undefined,
        near,
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...at.joints };
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...at.limbs };
      const next: Partial<
        Record<
          AutoMovieHumanLimb,
          NonNullable<IAutoMovieMotionHumanResolveHumanPosture.INear[AutoMovieHumanLimb]>
        >
      > = { ...near };
      for (const side of sides) {
        const limb: "leftArm" | "rightArm" = `${side}Arm`;
        if (at.limbs[limb] === undefined) continue;
        const arm: IAutoMovieMotionHumanArmAngles.IAngles =
          AutoMovieMotionHumanArmAngles.angles(solved.pose, side);
        joints[`${side}UpperArm`] = arm.upper;
        joints[`${side}LowerArm`] = arm.lower;
        joints[`${side}Hand`] = arm.hand;
        delete limbs[limb];
        const seed: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][typeof limb] =
          solved.seeds[limb];
        if (seed !== undefined && seed !== null)
          next[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
      }
      return { posture: { ...at, joints, limbs }, near: next };
    };
    const seeds = (k: number): IAutoMovieMotionHumanResolveHumanPosture.INear => {
      while (course.length <= k) {
        const j: number = course.length;
        course.push(fit(posture(j * step), j === 0 ? {} : course[j - 1]!).near);
      }
      return course[k]!;
    };
    return (seconds: number, now?: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const k: number = Math.min(last, Math.floor(t / step + 1e-9));
      return fit(now ?? posture(t), seeds(k)).posture;
    };
  }
}
