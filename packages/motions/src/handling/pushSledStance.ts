import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The stance a sled push (`pushSled`) takes its handles from: how far the
 * trunk inclines into the load and how far the body sinks onto bent knees.
 *
 * The incline is the measured one for the handles' height. Lim, Case and
 * D'Souza (2016, Proc HFES 60:970; 12 men, two-handed isometric pushes)
 * measured the torso's flexion from upright standing at three handle
 * heights, each the subject's own: 45.0 (SD 14.3) degrees at the hip, 26.9
 * (6.7) midway and 18.7 (8.4) at the shoulder at their highest force, the
 * one a sled push takes (`INCLINES`). A handle between two of them takes the
 * incline between theirs in proportion; a handle below the hip continues the
 * hip-to-midway slope, up to `RANGE`; above the shoulder keeps the
 * shoulder's; and never less than the push's own `lean`. An incline asked
 * outright (a haul at a declared load, `pushPullLean`) replaces all of it.
 *
 * The body then sinks onto bent knees as far as brings each wrist within the
 * arm's reach from its shoulder at the highest the walk raises it (`rise`),
 * so the hands keep their handles through the gait's rise and fall.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved, from which measurement and how a handle between or beyond them is read.
 * @evidence contracts/development/design.md#principled-representation The stance is an incline in degrees from the vertical and a sink in metres, the two values `AutoMovieMotionHumanTrunk.sunk` takes; the handle heights are the body's own hip and shoulder heights, as the study placed them at each subject's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The measured table, its bound, the reading rate, the stance and its solver, read by `pushSled`, and the floor, read by it and by `pushPull`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sled is named; the handles are the frames the law reads.
 */
export namespace pushSledStance {
  /** The torso's flexion from upright standing at the subject's hip, midway and shoulder handle heights, degrees, at the highest push force (Lim, Case and D'Souza 2016, motion capture means). The study gives the midway handle no height; it is read as halfway between the hip and the shoulder. */
  export const INCLINES: Readonly<
    Record<"hip" | "midway" | "shoulder", number>
  > = { hip: 45.0, midway: 26.9, shoulder: 18.7 };

  /** The steepest incline a push takes, degrees: the hip-height mean and two of its standard deviations, 45.0 + 2 x 14.3 (Lim, Case and D'Souza 2016), which leaves out the steepest fortieth of pushers. */
  export const RANGE: number = 45.0 + 2 * 14.3;

  /** The rate the walk's rise is read at, per second: the display's 30 frames. */
  export const RATE: number = 30;

  /** The trunk's incline from the vertical, degrees, and the body's sink onto bent knees, metres. */
  export interface IStance {
    /** Degrees from the vertical, from the push's lean to `RANGE`. */
    incline: number;

    /** Metres, not negative. */
    sink: number;
  }

  /**
   * Solve the stance.
   *
   * @param body The body.
   * @param walk The walk the push is written over.
   * @param settle The second of the walk the handles are taken at.
   * @param feet Each foot at the entry, whose lower sole is the floor.
   * @param handles Each hand's handle frame.
   * @param lean The least incline, degrees from the vertical.
   * @param incline The incline asked outright, degrees from the vertical, negative leaning back, which replaces the measured one and `lean` (a haul at a declared load, `pushPullLean`); the measured one when absent.
   * @returns The stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The incline is the study's, read at the handles' mean height above the floor as a piecewise-linear function of the body's own hip and shoulder heights; each wrist is placed by its grasp (`HumanHand.reach`) and the shoulders are read off the resolved leaned body, the sink the drop that brings the risen shoulder within the arm's reach for the floor distance it keeps, by Pythagoras.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The incline, then one sink pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The incline stops at `RANGE` and the sink only lowers the shoulders; a handle still beyond reach is the law's refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One walk posture per displayed frame of the push for its rise, and one posture resolution.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solved(
    body: IAutoMovieMotionHumanBody,
    walk: IAutoMovieMotionHumanActionPlan,
    settle: number,
    feet: IAutoMovieMotionHumanEntryState["feet"],
    handles: Record<
      IAutoMovieMotionHumanHand.Side,
      IAutoMovieMotionHumanHand.IFrame
    >,
    lean: number,
    incline?: number,
  ): IStance {
    const standing: IAutoMovieMotionHumanPosture = walk.posture(settle);

    // The floor under the entry's lower sole, and how far the walk raises
    // the body above where it takes the handles, read at the display rate.
    const floor: number = pushSledStance.floor(body, feet);
    let rise: number = 0;
    for (let t: number = settle; t <= walk.duration; t += 1 / RATE)
      rise = Math.max(rise, walk.posture(t).root.y - standing.root.y);
    const asked: Record<IAutoMovieMotionHumanHand.Side, IAutoMovieVector3> = {
      left: HumanHand.reach(body, "left", "grip", handles.left, "fist").point,
      right: HumanHand.reach(body, "right", "grip", handles.right, "fist")
        .point,
    };

    // The measured incline at the handles' height.
    const height: number =
      (handles.left.point.y + handles.right.point.y) / 2 - floor;
    const hip: number = body.measure.hipHeight;
    const shoulder: number = body.measure.shoulderHeight;
    const midway: number = (hip + shoulder) / 2;
    const between = (a: number, b: number, at: number, to: number): number =>
      at + ((to - at) * (height - a)) / (b - a);
    const measured: number =
      height >= shoulder
        ? INCLINES.shoulder
        : height >= midway
          ? between(midway, shoulder, INCLINES.midway, INCLINES.shoulder)
          : between(hip, midway, INCLINES.hip, INCLINES.midway);
    const inclined: number =
      incline ?? Math.min(RANGE, Math.max(lean, measured));

    // The sink that keeps each wrist within reach of its risen shoulder.
    const reach: number = body.measure.upperArm + body.measure.forearm;
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture(
          body,
          AutoMovieMotionHumanTrunk.sunk(body, standing, 0, inclined, 0),
        ),
      );
    let sink: number = 0;
    for (const side of ["left", "right"] as const) {
      const at: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;
      const flat: number = Math.hypot(
        asked[side].x - at.x,
        asked[side].z - at.z,
      );
      if (flat < reach)
        sink = Math.max(
          sink,
          at.y + rise - asked[side].y - Math.sqrt(reach * reach - flat * flat),
        );
    }
    return { incline: inclined, sink };
  }

  /**
   * The floor a push stands on: the height of the entry's lower sole, world
   * metres, from which a handle's height is read.
   *
   * @param body The body.
   * @param feet Each foot at the entry.
   * @returns The floor's height, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation Each sole is its foot's own offset carried by the ankle's frame; the lower one is the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One minimum over the two feet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No floor height is assumed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one floor the stance and a haul's handle height read (`pushPull`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function floor(
    body: IAutoMovieMotionHumanBody,
    feet: IAutoMovieMotionHumanEntryState["feet"],
  ): number {
    return Math.min(
      ...(["left", "right"] as const).map(
        (foot: IAutoMovieMotionHumanHand.Side): number =>
          feet[foot].ankle.y +
          Quaternion.rotateVector(
            feet[foot].rotation,
            HumanFoot.offset(body, foot, "sole"),
          ).y,
      ),
    );
  }
}
