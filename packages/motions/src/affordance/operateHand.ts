import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { operate } from "./operate";
import type { operateDrive } from "./operateDrive";
import { operateInsert } from "./operateInsert";
import { operateState } from "./operateState";
import type { StrikingHeld } from "../striking/StrikingHeld";

/**
 * Prepare an operation's original hand geometry for its actual arm targets
 * and the lean's wrist-only reach observations.
 *
 * @param context The unchanged operation, canonical body and actual film start.
 * @param props The fixed initial place, optional actual articulation/hinge/tool, and original stroke clock.
 * @returns Full current arm targets and world-metre wrist points from the actual posture and stroke progress.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed operation geometry, actual posture/progress, original inverse-clock film time, full targets and the lean's wrist-only output; no hand goal or elbow is fabricated for the narrow observation.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the original moving-part world frame, upright/lid/button forward choices and centred knob roll. HumanHandTarget owns actual surface alignment/placement and full targets' default Bend; insertion delegates the same original roll-grid/rank/fit owner before either output.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One insertion branch or original mechanism frame reader feeds the shared prepared hand owner. The two output readers differ only by whether the consumer needs an elbow target or a wrist point.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual articulation read, inversion probe, insertion roll rank/refinement/fit, full target Bend and original place/normal/curl/contact policy remains. Wrist-only observations omit solely the default elbow sweep whose result the lean discarded; no candidate, balance scan, bisection or tolerance changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fixed surface/rest basis or insertion axis/grid serves Q actual requests. Wrist-only reach requests omit an unconsumed bounded Bend sweep and repeated hand offset work; all current frame/alignment arithmetic and insertion fits remain actual. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan fixes body/side/mechanism/initial place/clock and immutable tool geometry. Every plan/runtime articulated query independently executes the original adjacent-float progress inversion and clock observations; an actual time is never substituted for that inverse, and arbitrary part.place callbacks retain their original film-second argument.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation owns fixed metadata and constant-size prepared hand/axis geometry until release. Each query releases its current placed frame and wrist/target scratch on return or throw, without retaining poses, times, fitted answers, FK loans or history.
 */
export function operateHand(context: IHumanActionContext<operate.IParams>, props: {
  clock: AutoMovieMotionClock.IClock;
  place: ReturnType<IHumanActionContext["aim"]>;
  part: operateDrive.IPart | undefined;
  hinge: operateDrive.IHinge | undefined;
  inserted: StrikingHeld.ITool | undefined;
  upright: number;
}): {
  target: (posture: IHumanPosture, progress: number) => AutoMovieMotionHumanArm.ITarget;
  wrist: (posture: IHumanPosture, progress: number) => IAutoMovieVector3;
} {
  const mechanism: operate.Mechanism = context.params.mechanism;
  const side: HumanHand.Side = context.params.hand ?? "right";
  if (mechanism.kind === "insert") {
    const insertion: ReturnType<typeof operateInsert.prepareMoving> =
      operateInsert.prepareMoving(context, mechanism, props.inserted!, props.place);
    return {
      target: insertion.target,
      wrist: (posture: IHumanPosture, progress: number): IAutoMovieVector3 =>
        insertion.wrist(posture, progress).point,
    };
  }
  const hand: ReturnType<typeof HumanHandTarget.prepareMoving> = HumanHandTarget.prepareMoving(
    context.body, side, {
      surface: mechanism.kind === "button" ? "indexTip" : "grip",
      shape: mechanism.kind === "button" ? "point" : "relaxed",
      curl: mechanism.kind === "button" ? 0 : 40,
    },
  );
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
      if (props.clock.progress("strokeStart", "strokeEnd", mid) < progress) lo = mid;
      else hi = mid;
    }
  };
  const frame: (posture: IHumanPosture, progress: number) => {
    place: { point: IAutoMovieVector3; normal: IAutoMovieVector3 };
    forward: IAutoMovieVector3;
  } = (posture: IHumanPosture, progress: number): ReturnType<typeof frame> => {
    const now: ReturnType<typeof operateState.at> = props.part === undefined
      ? operateState.at(mechanism, props.place, props.hinge, progress)
      : {
          ...props.part.place(progress, context.start + reached(progress)),
          roll: mechanism.kind === "knob" ? mechanism.turn * progress : 0,
        };
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const ahead: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, { x: 0, y: 0, z: 1 },
    );

    // Handles on upright faces take the original overhand orientation;
    // the knob's centred roll acts before its actual elbow is selected.
    const upright: boolean = mechanism.kind !== "button" && Math.abs(now.normal.y) < props.upright;
    const spin: ReturnType<typeof Quaternion.fromAxisAngle> = Quaternion.fromAxisAngle(
      now.normal, mechanism.kind !== "knob" ? 0
        : (upright ? (side === "left" ? 90 : -90) : 0) + mechanism.turn / 2 - now.roll,
    );
    return {
      place: upright ? { point: now.point, normal: Quaternion.rotateVector(spin, up) } : now,
      forward: mechanism.kind === "button" ? up
        : upright ? Quaternion.rotateVector(spin,
            Vector3.scale(Vector3.normalize(Vector3.cross(up, now.normal)), side === "left" ? 1 : -1))
          : mechanism.kind === "knob" ? Quaternion.rotateVector(spin, ahead)
            : Quaternion.rotateVector(Quaternion.fromAxisAngle(up, side === "left" ? -90 : 90), ahead),
    };
  };
  return {
    target: (posture: IHumanPosture, progress: number): AutoMovieMotionHumanArm.ITarget => {
      const current: ReturnType<typeof frame> = frame(posture, progress);
      return hand.target(posture, current.place, current.forward);
    },
    wrist: (posture: IHumanPosture, progress: number): IAutoMovieVector3 => {
      const current: ReturnType<typeof frame> = frame(posture, progress);
      return hand.wrist(posture, current.place, current.forward).point;
    },
  };
}
