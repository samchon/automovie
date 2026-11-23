import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
} from "@automovie/interface";

import { blendHumanJoint } from "../posture/blendHumanJoint";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";

/**
 * A law's arm goals fitted along the action's course, each instant's fit
 * continuing the swivel and the branch the course chose before it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, along what and why.
 * @evidence contracts/development/design.md#principled-representation The arms of a second are read off the course of continued fits on the planner's frame grid, a function of the second alone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the laws that state their arms as goals at each second.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fits are the posture resolver's own, continued as the planner's course continues them (`AutoMovieMotionHumanArmCourse`).
 */
export namespace AutoMovieMotionHumanArmChain {
  /**
   * The posture at a second with its arm goals solved along the course and
   * written as joints.
   *
   * A goal fitted alone at each second takes the best of the arm's swivels
   * for that second, and where two swivels trade places the arm jumps
   * between two seconds a frame apart (a bending free arm's elbow moved
   * 0.2 m between the descent's shares 0.7475 and 0.7474). The course is
   * therefore fitted on the planner's frame grid from the action's start,
   * each instant continuing the swivel, the branch and the arms the instant
   * before chose (`IAutoMovieSwivelNear`), the per-frame coherence a game's
   * IK keeps. A continued fit holds its hand on the goal and moves the
   * swivel at most one articulation step from its seed (`hingedSwivelNear`),
   * so the elbow follows its hint smoothly and never across a ridge of the
   * room. The course is plan data: each instant is fitted once, as a second
   * at or past it is first read, and a second reads its arms off the two
   * instants about it, blended joint by joint (`blendHumanJoint`), with no
   * fit of its own; so a second's arms do not depend on the order the
   * seconds are read in.
   *
   * @param body The body.
   * @param duration The action's duration, seconds.
   * @param posture The law's posture at a second, its arms as goals.
   * @param sides The arms to fit along the course.
   * @returns The posture at a second, those arms written as joints with their goals removed; given the law's posture at that second already read, that posture is the one written.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the defect, the grid, the continuation, how a second reads the course and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Continuation along a path, the per-frame seeding of an analytic IK by the frame before, as `AutoMovieMotionHumanArmCourse` fits a hold; the grid is the planner's, and between two of its instants the arm is the blend of their arms, as a trajectory's playback reads its waypoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain of continued fits on the grid; one blend of two instants per second read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every instant of the grid is fitted to its own goals, the action's end among them; a second on an instant reads that instant's fit exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms One continued fit per grid instant, laid once per plan up to the latest second read; a second read fits nothing, three joint blends per arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid instants' seeds and arms are the course's own record, read by every second after them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one seed record and one arm record per grid instant of the action and the course's one FK reader, released with the plan.
   */
  export function continued(
    body: IAutoMovieMotionHumanBody,
    duration: number,
    posture: (seconds: number) => IAutoMovieMotionHumanPosture,
    sides: readonly AutoMovieHumanSide[] = ["left", "right"],
  ): (
    seconds: number,
    now?: IAutoMovieMotionHumanPosture,
  ) => IAutoMovieMotionHumanPosture {
    const step: number = AutoMovieMotionHumanArmCourse.STEP;

    // The grid's instants: the frames from the start and the action's end.
    const times: number[] = [];
    for (let k: number = 0; k * step < duration - 1e-9; ++k)
      times.push(k * step);
    times.push(duration);
    const course: IInstant[] = [];
    // One reader for the course's fits: the course is one operation on one body.
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();

    // An instant's goals fitted continuing the seeds given: the arms the fit
    // chose and their seeds; a fit that names no seed leaves the one it
    // continued. A released arm supplies its actual unforced endpoint
    // angles for the preceding interpolation without supplying an IK seed.
    const fit = (
      at: IAutoMovieMotionHumanPosture,
      near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    ): IInstant => {
      const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        resolveHumanPosture.seeded(body, at, undefined, near, resolution);
      const arms: Partial<
        Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
      > = {};
      const next: Partial<
        Record<
          AutoMovieHumanLimb,
          NonNullable<
            IAutoMovieMotionHumanResolveHumanPosture.INear[AutoMovieHumanLimb]
          >
        >
      > = { ...near };
      for (const side of sides) {
        const limb: "leftArm" | "rightArm" = `${side}Arm`;
        arms[side] = AutoMovieMotionHumanArmAngles.angles(solved.pose, side);
        if (at.limbs[limb] === undefined) continue;
        const seed: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][typeof limb] =
          solved.seeds[limb];
        if (seed !== undefined && seed !== null)
          next[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
      }
      return { arms, near: next };
    };
    // An instant whose posture, goals included, is the one before it keeps
    // that instant's fit: the refinement a continued fit runs never returns
    // its seed exactly (the golden-section search's last probes, within the
    // swivel's resolution of the optimum: Kiefer 1953), so re-fitting an
    // unchanged goal stepped a held arm between two swivels a resolution
    // apart every frame (the overhead stretch's hold, 0.0004 degrees each
    // way). An IK seeded by the frame before solves nothing for a target
    // that has not moved, so a hold stays still.
    let previous: string | undefined;
    const instant = (k: number): IInstant => {
      while (course.length <= k) {
        const j: number = course.length;
        const at: IAutoMovieMotionHumanPosture = posture(times[j]!);
        const key: string = JSON.stringify(at);
        course.push(
          j > 0 && key === previous
            ? course[j - 1]!
            : fit(at, j === 0 ? {} : course[j - 1]!.near),
        );
        previous = key;
      }
      return course[k]!;
    };
    return (
      seconds: number,
      now?: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const at: IAutoMovieMotionHumanPosture = now ?? posture(t);
      // The instants about the second: the frame at or before it and the next.
      const k: number = Math.min(times.length - 2, Math.floor(t / step + 1e-9));
      const share: number =
        k < 0
          ? 0
          : Math.min(
              1,
              Math.max(0, (t - times[k]!) / (times[k + 1]! - times[k]!)),
            );
      const before: IInstant = instant(Math.max(0, k));
      const after: IInstant = k < 0 ? before : instant(k + 1);
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...at.joints };
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...at.limbs };
      for (const side of sides) {
        const limb: "leftArm" | "rightArm" = `${side}Arm`;
        if (at.limbs[limb] === undefined) continue;
        const from: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
          before.arms[side] ?? after.arms[side];
        const to: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
          after.arms[side] ?? before.arms[side];
        if (from === undefined || to === undefined) continue;
        joints[`${side}UpperArm`] = blendHumanJoint.between(
          body,
          `${side}UpperArm`,
          from.upper,
          to.upper,
        )(share);
        joints[`${side}LowerArm`] = blendHumanJoint.between(
          body,
          `${side}LowerArm`,
          from.lower,
          to.lower,
        )(share);
        joints[`${side}Hand`] = blendHumanJoint.between(
          body,
          `${side}Hand`,
          from.hand,
          to.hand,
        )(share);
        delete limbs[limb];
      }
      return { ...at, joints, limbs };
    };
  }

  /** A grid instant of the course: each goaled arm's fitted angles and the seeds that continue them. */
  interface IInstant {
    arms: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >;
    near: IAutoMovieMotionHumanResolveHumanPosture.INear;
  }
}
