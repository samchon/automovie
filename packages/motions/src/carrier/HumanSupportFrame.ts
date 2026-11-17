import {
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSupportFrame,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";

/**
 * The one reader of the frame a body's base rests on (#3491, P6): the
 * ground, a prop it sits or stands on (a saddle, a cart's bed, a deck), or a
 * performer's region it is borne on, with that frame's velocity and
 * acceleration at a second. Every consumer reads it here: a presented weapon
 * aimed in the support's frame, a launch inheriting the support's velocity,
 * the rider's inertial load (#3431), a borne person (#3437).
 *
 * The support is the bearing contact the action is entered on
 * (`IHumanEntryState.supports`): the seat or the feet, not a gripping hand,
 * the first one on a prop or a person, the ground when every one is on the
 * ground. The velocity and the acceleration are the central differences of
 * the support's origin at the engine's plan-time step
 * (`integrateMotionTrajectory.STEP`, #3424). A performer's region is read
 * only at and before the second evaluated (#3437's contract), so its
 * differences are backward ones over the same step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the support is, who reads it, how it is chosen and how its derivatives are taken, with the performer exception.
 * @evidence contracts/development/design.md#principled-representation A support is a rigid world frame with the first two time derivatives of its origin.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chosen support and its frame at a second.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The frame is the prop's or the bone's own displayed one; nothing is extrapolated from the entry.
 */
export namespace HumanSupportFrame {
  /**
   * The support the action is entered on: the first bearing contact on a
   * prop or a person, else the ground.
   *
   * @param context The action's context.
   * @returns The support.
   */
  export function of(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry" | "carrier">,
  ): IAutoMovieMotionHumanContactWindow.Support {
    // An overlay rides what its carrier stands on, even where its entry
    // still stood on the ground before the carrier began.
    if (context.carrier?.support !== undefined) return context.carrier.support;
    const bearing: IAutoMovieMotionHumanEntryState.ISupport | undefined =
      context.entry.supports.find(
        (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          s.kind !== "grip" && s.support.kind !== "ground",
      );
    return bearing?.support ?? { kind: "ground" };
  }

  /**
   * The frame an entry part already bears on. Continuing a plant keeps
   * that frame; a part with no declared contact starts on the ground.
   *
   * @param context The displayed entry's contacts.
   * @param part The contact part being continued.
   * @returns Its support frame.
   * @evidence contracts/development/common.md#meaningful-documentation States continuation and the absent-contact default.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the same part's existing contact, preserving a prop or person identity through an action transition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and the ground default.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No inferred frame from height or proximity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the few declared entry contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A direct entry reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function contact(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    part: IAutoMovieMotionHumanContactWindow["part"],
  ): IAutoMovieMotionHumanContactWindow.Support {
    return (
      context.entry.supports.find(
        (support: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          support.part === part,
      )?.support ?? { kind: "ground" }
    );
  }
  /**
   * The floor actually touched by the planted entry feet, read from their
   * displayed sole sockets. With no planted foot the ground is the default.
   *
   * @param body The body.
   * @param entry The displayed entry.
   * @returns World metres.
   * @evidence contracts/development/common.md#meaningful-documentation States the measured datum and absent-contact case.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics places each planted foot's actual sole sockets, including articulated toes; the lowest socket defines its bearing plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose and the minimum of the bearing sockets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A raised heel's ankle height is never substituted for its contact height.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics and six socket readings at most.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses HumanFoot.sockets as the surface datum.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function floor(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
  ): number {
    const planted: ("left" | "right")[] = (["left", "right"] as const).filter(
      (side: "left" | "right"): boolean => entry.feet[side].planted,
    );
    if (planted.length === 0) return 0;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
    );
    return Math.min(
      ...planted.flatMap((side: "left" | "right"): number[] =>
        HumanFoot.sockets(body, bones, side).map(
          (socket: IAutoMovieMotionHumanFoot.ISocket): number => socket.point.y,
        ),
      ),
    );
  }
  /**
   * Refuse stepping from the ground onto a moving prop faster than the gait
   * can match (#3491): getting on is a step at a matched speed, so a support
   * that moves faster at the action's start than the gait's own speed cannot
   * be boarded. A body already on that prop is not boarding.
   *
   * @param context The action's context.
   * @param prop The prop stepped onto.
   * @param speed The gait's speed, m/s.
   * @throws {HumanRefusal} A `base` refusal on `on` with the speeds and the fix.
   */
  export function board(
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "entry" | "prop" | "performer" | "start"
    >,
    prop: string,
    speed: number,
  ): void {
    const current: IAutoMovieMotionHumanContactWindow.Support = of(context);
    if (current.kind === "prop" && current.subject === prop) return;
    const moving: number = Vector3.length(
      at(context, context.start, { kind: "prop", subject: prop }).velocity,
    );
    if (moving > speed)
      throw new HumanRefusal({
        kind: "base",
        axis: "on",
        value: moving,
        feasible: { kind: "range", minimum: 0, maximum: speed, unit: "m/s" },
        reason: `${prop} moves at ${moving.toFixed(2)} m/s, faster than the gait's ${speed.toFixed(2)} m/s, so it cannot be stepped onto`,
        fix: `slow ${prop} to the gait's speed before boarding it, or board it at a faster pace`,
      });
  }

  /**
   * The support's frame, velocity and acceleration at a film second.
   *
   * @param context The action's context.
   * @param seconds Film seconds.
   * @param named A support named outright, such as the prop a walk is to step onto; the one the action is entered on when absent.
   * @returns The frame.
   */
  export function at(
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "entry" | "prop" | "performer"
    >,
    seconds: number,
    named?: IAutoMovieMotionHumanContactWindow.Support,
  ): IAutoMovieMotionHumanSupportFrame.IFrame {
    const support: IAutoMovieMotionHumanContactWindow.Support =
      named ?? of(context);
    if (support.kind === "ground")
      return {
        support,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
      };
    const frame = (t: number): IAutoMovieMotionHumanProp.IFrame => {
      if (support.kind === "prop")
        return context.prop(support.subject).frame(t);
      const other: IAutoMovieMotionHumanActionContext.IPerformer =
        context.performer(support.subject);
      const bone: AutoMovieHumanoidBone =
        "bone" in support
          ? support.bone
          : other.body.surfaces.regions[support.region].bone;
      const posed: IAutoMovieResolvedBone = other.bones(t).get(bone)!;
      return HumanPropFrame.bone(posed);
    };
    const h: number = integrateMotionTrajectory.STEP;
    const now: IAutoMovieMotionHumanProp.IFrame = frame(seconds);

    // A person is read only up to the second evaluated: backward differences.
    const [before, after]: [IAutoMovieVector3, IAutoMovieVector3] =
      support.kind === "person"
        ? [frame(seconds - 2 * h).position, frame(seconds - h).position]
        : [frame(seconds - h).position, frame(seconds + h).position];
    const velocity: IAutoMovieVector3 =
      support.kind === "person"
        ? Vector3.scale(Vector3.subtract(now.position, after), 1 / h)
        : Vector3.scale(Vector3.subtract(after, before), 1 / (2 * h));
    const acceleration: IAutoMovieVector3 =
      support.kind === "person"
        ? Vector3.scale(
            Vector3.add(
              Vector3.subtract(now.position, Vector3.scale(after, 2)),
              before,
            ),
            1 / (h * h),
          )
        : Vector3.scale(
            Vector3.add(
              Vector3.subtract(after, Vector3.scale(now.position, 2)),
              before,
            ),
            1 / (h * h),
          );
    return {
      support,
      position: now.position,
      rotation: Quaternion.normalize(now.rotation),
      velocity,
      acceleration,
    };
  }
}
