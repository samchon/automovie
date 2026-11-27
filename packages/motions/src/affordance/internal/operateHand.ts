import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHandTarget } from "../../posture/HumanHandTarget";
import { operateInsert } from "./operateInsert";
import { operateState } from "./operateState";

/** The record of `IOperateHandFrame`'s site. */
type IOperateHandFrame = {
  place: IOperateHandFramePlace;
  forward: IAutoMovieVector3;
};

/** The record of `IOperateHandFramePlace`'s site. */
type IOperateHandFramePlace = {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
};

/** The record of `IOperateHandResult`'s site. */
type IOperateHandResult = {
  target: (
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
    seconds?: number,
  ) => IAutoMovieMotionHumanArmTarget.ITarget;
  wrist: (
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
    seconds?: number,
  ) => IAutoMovieVector3;
};

/** The record of `IOperateHandProps`'s site. */
type IOperateHandProps = {
  clock: IAutoMovieMotionClock;
  place: ReturnType<IAutoMovieMotionHumanActionContext["aim"]>;
  part: IAutoMovieMotionHumanOperateDrive.IPart | undefined;
  hinge: IAutoMovieMotionHumanOperateDrive.IHinge | undefined;
  inserted: IAutoMovieMotionHumanStrikingHeld.ITool | undefined;
  upright: number;
};

/**
 * Prepare an operation's original hand geometry for its actual arm targets and
 * the lean's wrist-only reach observations.
 *
 * @param context The unchanged operation, canonical body and actual film start.
 * @param props The fixed initial place, optional actual
 *   articulation/hinge/tool, and original stroke clock.
 * @returns Full current arm targets and world-metre wrist points from the
 *   actual posture and stroke progress, an articulated part read at the
 *   action-relative second given, else at the progress's stroke time.
 */
export function operateHand(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanOperate.IParams>,
  props: IOperateHandProps,
): IOperateHandResult {
  const mechanism: IAutoMovieMotionHumanOperate.Mechanism = context.params.kind;
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  if (mechanism.kind === "insert") {
    const insertion: ReturnType<typeof operateInsert.prepareMoving> =
      operateInsert.prepareMoving(
        context,
        mechanism,
        props.inserted!,
        props.place,
      );
    return {
      target: insertion.target,
      wrist: (
        posture: IAutoMovieMotionHumanPosture,
        progress: number,
      ): IAutoMovieVector3 => insertion.wrist(posture, progress).point,
    };
  }
  const hand: ReturnType<typeof HumanHandTarget.prepareMoving> =
    HumanHandTarget.prepareMoving(context.body, side, {
      surface: mechanism.kind === "button" ? "indexTip" : "grip",
      shape: mechanism.kind === "button" ? "point" : "relaxed",
      curl: mechanism.kind === "button" ? 0 : 40,
    });
  // A rigid prop's part moves by the mechanism's own geometry, prepared once
  // for the plan; an articulated one is posed by the prop.
  const rigid: ReturnType<typeof operateState.prepare> | undefined =
    props.part === undefined
      ? operateState.prepare(mechanism, props.place, props.hinge)
      : undefined;
  // A knob on a crank's arm spins free on its pin as the arm carries it
  // round the axle, so the hand keeps its attitude and only orbits; a knob
  // turned in place rolls the hand with it.
  const part: IAutoMovieMotionHumanOperateDrive.IPart | undefined = props.part;
  const crank: boolean =
    part !== undefined &&
    (context.prop(part.prop).prop.affordances ?? []).some(
      (a: IAutoMovieAffordance): boolean =>
        a.id === part.articulation && a.kind === "crank",
    );
  const rolls: boolean = mechanism.kind === "knob" && !crank;
  const strokeStart: number = props.clock.at("strokeStart");
  const strokeEnd: number = props.clock.at("strokeEnd");

  // Every part query retains the original adjacent-float inverse, including
  // runtime queries: progress can map multiple seconds to the same value.
  const reached: (progress: number) => number = (progress: number): number => {
    let lo: number = strokeStart;
    let hi: number = strokeEnd;
    if (!(progress > 0)) return lo;
    if (!(progress < 1)) return hi;
    for (;;) {
      const mid: number = (lo + hi) / 2;
      if (mid === lo || mid === hi) return mid;
      if (props.clock.progress("strokeStart", "strokeEnd", mid) < progress)
        lo = mid;
      else hi = mid;
    }
  };
  const frame: (
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
    seconds?: number,
  ) => IOperateHandFrame = (
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
    seconds?: number,
  ): ReturnType<typeof frame> => {
    const now: ReturnType<typeof operateState.at> =
      props.part === undefined
        ? rigid!(progress)
        : {
            // At an actual second the part is where it is then, so a reach to a
            // moving part intercepts it; a plan-time read takes its stroke time.
            ...props.part.place(
              progress,
              context.start + (seconds ?? reached(progress)),
            ),
            roll:
              rolls && mechanism.kind === "knob"
                ? mechanism.turn * progress
                : 0,
          };
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const ahead: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      { x: 0, y: 0, z: 1 },
    );

    // Handles on upright faces take the original overhand orientation;
    // the knob's centred roll acts before its actual elbow is selected.
    const upright: boolean =
      mechanism.kind !== "button" && Math.abs(now.normal.y) < props.upright;
    const spin: ReturnType<typeof Quaternion.fromAxisAngle> =
      Quaternion.fromAxisAngle(
        now.normal,
        mechanism.kind !== "knob"
          ? 0
          : (upright ? (side === "left" ? 90 : -90) : 0) +
              (rolls ? mechanism.turn / 2 - now.roll : 0),
      );
    return {
      place: upright
        ? { point: now.point, normal: Quaternion.rotateVector(spin, up) }
        : now,
      forward:
        mechanism.kind === "button"
          ? up
          : upright
            ? Quaternion.rotateVector(
                spin,
                Vector3.scale(
                  Vector3.normalize(Vector3.cross(up, now.normal)),
                  side === "left" ? 1 : -1,
                ),
              )
            : mechanism.kind === "knob"
              ? Quaternion.rotateVector(spin, ahead)
              : Quaternion.rotateVector(
                  Quaternion.fromAxisAngle(up, side === "left" ? -90 : 90),
                  ahead,
                ),
    };
  };
  return {
    target: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
      seconds?: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget => {
      const current: ReturnType<typeof frame> = frame(
        posture,
        progress,
        seconds,
      );
      return hand.target(posture, current.place, current.forward);
    },
    wrist: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
      seconds?: number,
    ): IAutoMovieVector3 => {
      const current: ReturnType<typeof frame> = frame(
        posture,
        progress,
        seconds,
      );
      return hand.wrist(posture, current.place, current.forward).point;
    },
  };
}
