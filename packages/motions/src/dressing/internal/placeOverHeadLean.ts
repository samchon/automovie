import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlaceOverHead,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmPhrase } from "../../compose/internal/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { HumanTrunkLean } from "../../handling/internal/HumanTrunkLean";
import { pickUpAdjust } from "../../handling/internal/pickUpAdjust";
import type { pickUpPosture } from "../../handling/internal/pickUpPosture";
import type { placeOverHeadPath } from "./placeOverHeadPath";
import type { placeOverHeadStance } from "./placeOverHeadStance";

/*
 * A neck-loop dresser's composed and leaned plan (`placeOverHead`): the base, a
 * stepped stance's step in over the reach and back over the return, both hands'
 * strokes along the loop's path in one composition, and past the crown the
 * least hinge at the hips that keeps both wrists within their arms, solved at
 * the path's key points and ridden on its progress. Read from the plan's
 * context, arms, stance, clock, origins and path.
 * Parameter scope: What the plan composes from.
 * Returns: The leaned plan and the arms' span.
 */
export function placeOverHeadLean(
  scope: placeOverHeadLean.IScope,
): placeOverHeadLean.ILean {
  const {
    context,
    body,
    side,
    other,
    stance,
    on,
    clock,
    origins,
    path,
    holding,
    grasping,
  }: placeOverHeadLean.IScope = scope;
  // A stepped stance is the base: the foot steps in over the reach and
  // back over the return, on the pick-up's minimum-jerk share
  // (`pickUpAdjust.plants`), as a touch's step is.
  const stride: pickUpPosture.IStance | null = stance.stride;
  const base: IAutoMovieMotionHumanActionPlan =
    stride === null
      ? AutoMovieMotionHumanBase.under(context, clock.duration)
      : {
          duration: clock.duration,
          events: [],
          contacts: pickUpAdjust.plants(
            stride,
            clock.at("ready"),
            clock.at("relax"),
            clock.duration - clock.at("relax"),
            1,
          ),
          posture: (
            seconds: number,
            _channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
          ): IAutoMovieMotionHumanPosture =>
            stride.at(
              clock.envelope(["start", "ready"], ["relax", "end"], seconds),
              resolution,
            ),
        };
  const plan: IAutoMovieMotionHumanActionPlan =
    composeMotionHumanAction({
      base,
      clock,
      primitives: [side, other].map(
        (arm: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => ({
          ...AutoMovieMotionHumanArmPhrase.stroke({
            body,
            clock,
            side: arm,
            origin: origins[arm],
            path: (
              _posture: IAutoMovieMotionHumanPosture,
              _seconds: number,
              progress: number,
            ): IAutoMovieMotionHumanArmTarget.ITarget =>
              arm === side
                ? holding(path.at(progress))
                : grasping(path.at(Math.min(progress, path.assistUntil ?? 1))),
          }),
          // The holding hand keeps the fingers it holds the loop with.
          ...(arm === side ? { channels: [`${arm}Arm`] } : {}),
          reads: ["root", `${arm}Arm`, `${arm}Hand`],
        }),
      ),
      contact: "strokeEnd",
    });
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: clock.at("ready"),
    relax: clock.at("relax"),
    end: clock.duration,
  };
  // Past the crown the loop comes down over the head to a seated
  // partner's nape and chest, below and beyond the standing arms: the
  // hands follow it there by the least hinge at the hips that brings both
  // wrists within their arms at that point of the path
  // (`HumanTrunkLean.least`, a closed form per instant), as `dressPartner`
  // reaches a kneeling crown, so the dresser keeps its standoff at the
  // seated knees. The hinge rides the path's own progress, comes in over
  // the reach and goes out over the return on the minimum-jerk profile
  // (Flash and Hogan 1985). The crown itself is reached standing, its
  // refusal above naming the partner.
  const wrist: (
    arm: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanArmTarget.ITarget,
  ) => HumanTrunkLean.IWrist = (
    arm: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanArmTarget.ITarget,
  ): HumanTrunkLean.IWrist => ({
    side: arm,
    point: AutoMovieMotionHumanArmTarget.goal(body, arm, target).point,
    rotation: target.rotation,
  });
  // The hinge is solved once per plan at `HINGES` + 1 evenly spaced
  // points of the path and read between them in proportion, so a
  // posture's read solves nothing.
  const keyed: readonly number[] = Array.from(
    { length: HINGES + 1 },
    (_: unknown, k: number): number => {
      const progress: number = k / HINGES;
      const at: IAutoMovieRigidTransform = path.at(progress);
      const wrists: HumanTrunkLean.IWrist[] = [wrist(side, holding(at))];
      if (progress <= (path.assistUntil ?? 1))
        wrists.push(wrist(other, grasping(at)));
      return HumanTrunkLean.least(on(stance.posture), wrists);
    },
  );
  const hinged: (progress: number) => number = (progress: number): number => {
    const x: number = Math.min(HINGES, Math.max(0, progress * HINGES));
    const k: number = Math.min(HINGES - 1, Math.floor(x));
    return keyed[k]! + (keyed[k + 1]! - keyed[k]!) * (x - k);
  };
  const hinge: (seconds: number) => number = (seconds: number): number =>
    seconds <= span.ready
      ? hinged(0) *
        AutoMovieEngineMotionSampling.minimumJerkShare(
          span.ready > 0 ? Math.max(0, seconds / span.ready) : 1,
        )
      : seconds <= span.relax
        ? hinged(clock.progress("strokeStart", "strokeEnd", seconds))
        : hinged(1) *
          (1 -
            AutoMovieEngineMotionSampling.minimumJerkShare(
              Math.min(1, (seconds - span.relax) / (span.end - span.relax)),
            ));
  const deepest: number = Math.max(...keyed);
  const leaned: IAutoMovieMotionHumanActionPlan =
    deepest > 0
      ? {
          ...HumanTrunkLean.moving(plan, deepest),
          posture: (
            seconds: number,
            channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
            projection?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[3],
          ): IAutoMovieMotionHumanPosture =>
            HumanTrunkLean.lean(
              body,
              plan.posture(seconds, channels, resolution, projection),
              hinge(seconds),
            ),
        }
      : plan;

  return { leaned, span };
}

/*
 * What a neck-loop dresser's composed plan reads and what it is.
 */
export namespace placeOverHeadLean {
  /*
   * What a neck-loop plan composes from.
   */
  export interface IScope {
    /*
     * The action's context.
     */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPlaceOverHead>;

    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The hand that holds the loop at entry.
     */
    side: AutoMovieHumanSide;

    /*
     * The hand that takes the loop's other handle.
     */
    other: AutoMovieHumanSide;

    /*
     * The dresser's chosen stance (`placeOverHeadStance`).
     */
    stance: placeOverHeadStance.IStance;

    /*
     * The context as a stance (`placeOverHeadStance`).
     */
    on: placeOverHeadStance.IChosen["on"];

    /*
     * The phrase's clock.
     */
    clock: IAutoMovieMotionClock;

    /*
     * Each hand's place before and after.
     */
    origins: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmTarget.IOrigin>;

    /*
     * The loop's path.
     */
    path: placeOverHeadPath.IPath;

    /*
     * The holding hand's target (`placeOverHeadStance.IScope.holding`).
     */
    holding: placeOverHeadStance.IScope["holding"];

    /*
     * The other hand's target (`placeOverHeadStance.IScope.grasping`).
     */
    grasping: placeOverHeadStance.IScope["grasping"];
  }

  /*
   * The leaned plan and the arms' span.
   */
  export interface ILean {
    /*
     * The composed plan, leaned at the hips past the crown.
     */
    leaned: IAutoMovieMotionHumanActionPlan;

    /*
     * The arms' course span.
     */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;
  }
}
/*
 * How many even pieces of the loop's path the hip hinge is solved at the ends
 * of, once per plan (provisional: the path's few key frames, each piece a
 * fraction of the descent over the head).
 */
const HINGES: number = 8;
