import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanInterruptRow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanThrowObject,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieMotionHumanThrowObjectParams,
  IAutoMovieMotionManner,
  IAutoMovieProjectile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBendTrack } from "../../compose/internal/AutoMovieMotionHumanBendTrack";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { poseBones } from "../../posture/internal/poseBones";
import { precisionThrow } from "./precisionThrow";
import { throwObjectAim } from "../throwObject/throwObjectAim";
import { throwObjectBalance } from "../throwObject/throwObjectBalance";
import { throwObjectCurve } from "./throwObjectCurve";
import { throwObjectForm } from "../throwObject/throwObjectForm";
import { throwObjectLaunch } from "./throwObjectLaunch";
import { throwObjectLever } from "../throwObject/throwObjectLever";
import { throwObjectRelease } from "../throwObject/throwObjectRelease";
import { throwObjectSwing } from "../throwObject/throwObjectSwing";

/*
 * Throwing a held object to a target: overarm, underarm, or a gentle toss.
 *
 * The goal is a launch: the object, held at the hand's grip, leaves the hand at
 * the release with the velocity whose drag-free ballistic path takes the point
 * that flies, the held prop's own origin (or the grip of an empty hand,
 * `throwObjectLever`), through the target. The release angle is the style's
 * (`throwObjectForm.ANGLE`, provisional; underarm precision throws regulate
 * speed and angle by distance, Dupuy, Mottet and Ripoll 2000, J Sports Sci
 * 18:375), and the speed follows from the range equation `v^2 = g d^2 / (2
 * cos^2 a (d tan a - h))` for the horizontal distance `d` and the rise `h` to
 * the target; a target the angle cannot reach is refused. The chamber and the
 * finish are places around the standing shoulder in arm lengths
 * (`throwObjectForm.PLACES`, provisional); the release is read from the
 * shoulder of the trunk's release pose, at the arm's reach for the elbow's
 * flexion where a study gives it (throwObjectRelease). The hand is drawn
 * back to the chamber on minimum-jerk progress (the windup), then driven on a
 * cubic Hermite curve from rest at the chamber to the launch velocity, taking
 * twice the path's length over the launch speed (the time of constant
 * acceleration from rest), carries that velocity unchanged for
 * `throwObjectForm.CARRY` seconds on each side of the release point, so the
 * launch does not depend on the instant the hand opens within it, and goes on
 * to rest at the finish over the same time; it holds, then returns to where it
 * hung. The trunk turns toward the throwing side in the windup, back square to
 * the line by the release and through to the other side by the finish, so the
 * trunk leads the arm (the proximal-to-distal sequence, Putnam 1993, J Biomech
 * 26 Suppl 1:125), and inclines forward from the cocking to the style's
 * `throwObjectForm.TILT` at release (Fleisig et al. 1999), rising again in the
 * recovery. Events: `windup` at the start, `cocked` (the end of cocking,
 * Fleisig et al. 1995's maximum external rotation for an overarm throw),
 * `release`, `followThrough`, `recover`.
 *
 * The plan carries its launch (`of`), so a catcher can intercept the path. A
 * thrown `prop` rides the hand by a grip window to the release and is launched
 * there (`IHumanActionPlan.launches`), so it flies the same path; `angle`
 * replaces the style's release angle for a row with its own. An `implement`
 * held in the hand lengthens the lever the launch leaves from and stays held
 * after it (`holds`), only the prop flying; a `turns` attitude spins the prop
 * at the lever's rate rounded to whole half turns to the target
 * (`throwObjectLever`). Not yet: the stride, the two-hand chest pass and
 * overhead throws, the thrown prop riding the implement before the release (it
 * leaves from the implement's point, set on its way, until a prop can hold a
 * prop), the release-timing scatter of the endpoint-error model (Hore et al.
 * 1995), and feints.
 */
export namespace throwObject {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "throwObject";

  /*
   * The launch is the throw's physical outcome. Prop flight starts at its own
   * release.
   */
  export const physical: boolean = true;

  /*
   * Cancel table: the thrower stands or walks once the follow-through ends, and
   * may catch what it threw from the release on.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    catchObject: [
      { window: ["release", 1], kind: "inertialize", entry: 0, blend: 0.1 },
    ],
    stand: [after()],
    walk: [after()],
  };

  /*
   * May be performed over a carrier, such as seated or while another action
   * carries the body: it claims only the parts it moves.
   */
  export const overlay: boolean = true;

  /*
   * Seconds before and after the release through which the hand carries its
   * launch velocity (`throwObjectForm.CARRY`).
   */
  export const CARRY: number = throwObjectForm.CARRY;

  /*
   * A point of a launch's drag-free path (`throwObjectLaunch.path`).
   */
  export const path = throwObjectLaunch.path;

  /*
   * Plan a throw.
   * Parameter context: The action's context.
   * Returns: The plan with its launch.
   * When the release angle cannot reach the target.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanThrowObjectParams>,
  ): IAutoMovieMotionHumanThrowObject.IPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const style: IAutoMovieMotionHumanThrowObjectForm.Style =
      context.params.style ?? "overarm";
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    const outward: number = side === "left" ? 1 : -1;
    const arm: number = m.upperArm + m.forearm;
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const {
      frame,
      chamber,
      finish,
      target,
      toward,
      up,
      stance,
      release,
      implement,
      lever,
      velocity,
      accelerate,
      before,
      after,
    }: ReturnType<typeof throwObjectAim> = throwObjectAim(
      context,
      body,
      style,
      side,
      outward,
      arm,
    );

    // The styled windup leads into the fixed acceleration and release phases.
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence([
        { name: "windup", seconds: throwObjectForm.WINDUP[style] },
        { name: "cocked", seconds: accelerate },
        { name: "release", seconds: 2 * accelerate },
        { name: "followThrough", seconds: 0.15 },
        { name: "recover", seconds: 0.5 },
      ]),
      modifiers,
      { holds: ["followThrough"], fixed: ["cocked", "release"] },
    );
    const duration: number = clock.duration;
    const cockedAt: number = clock.at("cocked");
    const releasedAt: number = clock.at("release");
    const followedAt: number = clock.at("followThrough");
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);

    const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const accelerating: number = releasedAt - throwObjectForm.CARRY - cockedAt;
    const following: number = followedAt - releasedAt - throwObjectForm.CARRY;
    const accelerateCurve: ReturnType<typeof throwObjectCurve> =
      throwObjectCurve(chamber, still, before, velocity, accelerating);
    const followCurve: ReturnType<typeof throwObjectCurve> = throwObjectCurve(
      after,
      velocity,
      finish,
      still,
      following,
    );
    const restBones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
    );
    const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        restBones,
        { origin: context.entry.posture.root, yaw: context.entry.posture.yaw },
        side,
        "grip",
      );
    // Carry uses the lever's rotation, or the held orientation without an implement.
    const cocking: IAutoMovieQuaternion = lever.rotation(
      -throwObjectForm.CARRY,
    );
    const carriedOut: IAutoMovieQuaternion = lever.rotation(
      throwObjectForm.CARRY,
    );
    const finished: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: toward,
      palm: Vector3.scale(up, -1),
    });
    /*
     * Actual world grip-surface point and hand attitude, before inverse wrist
     * placement.
     */
    type GripFrame = Pick<IAutoMovieMotionHumanArmTarget.ITarget, GripFrame2>;
    const restAt: (posture: IAutoMovieMotionHumanPosture) => GripFrame = (
      posture: IAutoMovieMotionHumanPosture,
    ): GripFrame => ({
      point: AutoMovieMotionHumanArm.point(posture, origin),
      rotation: Quaternion.multiply(
        HumanFrame.turn(posture.yaw),
        origin.rotation,
      ),
    });
    const swing: throwObjectSwing.ISwing = throwObjectSwing(body, side, style);
    const grip: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => GripFrame = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): GripFrame => {
      if (seconds <= cockedAt) {
        const rest: GripFrame = restAt(posture);
        const u: number = clock.progress("windup", "cocked", seconds);
        return {
          point:
            style === "windmill"
              ? precisionThrow.windmill(frame, arm, chamber, rest.point, u)
              : swing.windup(posture, rest.point, chamber, u),
          rotation: Quaternion.slerp(rest.rotation, cocking, u),
        };
      }
      // The carry: the hand's share of the launch held through the release,
      // turning with the lever.
      const carried: number = seconds - releasedAt;
      if (Math.abs(carried) <= throwObjectForm.CARRY)
        return {
          point: Vector3.add(release, Vector3.scale(velocity, carried)),
          rotation:
            carried <= 0
              ? lever.rotation(carried)
              : Quaternion.slerp(
                  lever.rotation(carried),
                  finished,
                  AutoMovieEngineMotionSampling.minimumJerkShare(
                    clock.linear("release", "followThrough", seconds),
                  ),
                ),
        };
      if (seconds <= releasedAt) {
        return {
          point: accelerateCurve((seconds - cockedAt) / accelerating),
          rotation: cocking,
        };
      }
      if (seconds <= followedAt) {
        return {
          point: followCurve((carried - throwObjectForm.CARRY) / following),
          rotation: Quaternion.slerp(
            carriedOut,
            finished,
            AutoMovieEngineMotionSampling.minimumJerkShare(
              clock.linear("release", "followThrough", seconds),
            ),
          ),
        };
      }
      const rest: GripFrame = restAt(posture);
      const u: number = clock.progress("recover", "end", seconds);
      return {
        point: Vector3.lerp(finish, rest.point, u),
        rotation: Quaternion.slerp(finished, rest.rotation, u),
      };
    };
    const prop: string | undefined = context.params.prop;
    const gripOffset: IAutoMovieVector3 = {
      ...HumanHand.offset(body, side, "grip", "relaxed").point,
    };
    function wristAt(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanHand.IWrist {
      const g: GripFrame = grip(posture, seconds);
      return placeHumanHandSurface(gripOffset, g.point, g.rotation);
    }
    const elbow: AutoMovieMotionHumanBendTrack.ITrack =
      AutoMovieMotionHumanBendTrack({
        body,
        side,
        from: 0,
        to: duration,
        goal: wristAt,
        fallback: "hang",
      });
    const throwing: IAutoMovieMotionHumanPrimitive = {
      channels: [`${side}Arm`, `${side}Hand`],
      from: 0,
      to: duration,

      // A thrown prop rides the hand until the release; an implement stays
      // in it throughout.
      contacts:
        implement === undefined
          ? throwObjectLaunch.held(prop, side, releasedAt / duration)
          : throwObjectLaunch.held(implement.prop, side, 1),

      // The elbow is solved once over the span, when the action is planned,
      // and continued through it (`AutoMovieMotionHumanBendTrack`).
      prepare: (before: IAutoMovieMotionHumanPrimitive.Reader): void =>
        elbow.prepare(before),
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const wrist: IAutoMovieMotionHumanHand.IWrist = wristAt(
          posture,
          seconds,
        );
        const goal: IAutoMovieHumanLimbGoal =
          AutoMovieMotionHumanArmTarget.fromWrist(
            wrist,
            elbow.elbow(posture, seconds, wrist),
            { ...gripOffset! },
          );
        const arm: IAutoMovieHumanLimbGoal = swing.elbow(posture, goal);
        return { ...posture, limbs: { ...posture.limbs, [`${side}Arm`]: arm } };
      },
    };

    // The trunk turns toward the throwing side in the windup, back square to
    // the line by the release and through to the other side by the finish,
    // ahead of the arm; it inclines forward from the cocking to the release
    // and rises again in the recovery.
    const turn: number = outward * throwObjectForm.TURN[style];
    const trunk: IAutoMovieMotionHumanPrimitive = {
      channels:
        stance === undefined
          ? ["trunk"]
          : ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const degrees: number =
          turn *
            clock.envelope(
              ["windup", "cocked"],
              ["cocked", "release"],
              seconds,
            ) -
          0.6 *
            turn *
            clock.envelope(
              ["release", "followThrough"],
              ["recover", "end"],
              seconds,
            );
        const inclined: number = clock.envelope(
          ["cocked", "release"],
          ["recover", "end"],
          seconds,
        );
        const sunk: IAutoMovieMotionHumanPosture =
          stance?.(posture, inclined) ?? posture;
        return {
          ...sunk,
          joints: throwObjectRelease.trunk(
            sunk.joints,
            degrees,
            throwObjectForm.TILT[style] * inclined,
          ),
        };
      },
    };

    const asked: IAutoMovieMotionHumanThrowObjectParams["attitude"] =
      context.params.attitude;
    const attitude: IAutoMovieProjectile.Attitude | undefined =
      asked?.kind !== "turns"
        ? asked
        : prop === undefined
          ? undefined
          : throwObjectLever.spin(context, side, prop, lever, target);
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "release",
        primitives: [trunk, throwing, ...throwObjectBalance(context, clock)],
      });
    return {
      ...composed,
      ...(style === "windmill"
        ? {
            events: [
              ...composed.events,
              { name: "windmillApex", share: cockedAt / (2 * duration) },
            ].sort((a, b): number => a.share - b.share),
          }
        : {}),
      ...(implement === undefined
        ? {}
        : { holds: [{ side, prop: implement.prop, from: 1 }] }),
      physicalWindow: {
        from: cockedAt,
        to: releasedAt + throwObjectForm.CARRY,
      },
      launch: {
        point: lever.point,
        velocity: lever.velocity,
        seconds: releasedAt,
        target,
      },
      // The prop leaves the lever's end with the support's velocity added
      //, turning as asked or at the act's chosen spin.
      launches: precisionThrow.launches(
        context,
        style,
        throwObjectLaunch.launches(prop, attitude, {
          point: lever.point,
          velocity: Vector3.add(
            lever.velocity,
            HumanSupportFrame.at(context, context.start + releasedAt).velocity,
          ),
          seconds: releasedAt,
          target,
        }),
      ),
    };
  }

  /*
   * The cut once the follow-through ends.
   */
  function after(): IAutoMovieMotionHumanInterruptRow {
    return {
      window: ["followThrough", 1],
      kind: "inertialize",
      entry: 0,
      blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
    };
  }
}

/*
 * The alternatives of `GripFrame2`'s site.
 */
type GripFrame2 = "point" | "rotation";
