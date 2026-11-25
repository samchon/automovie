import {
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupportFrame,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";

/**
 * The support the action is entered on: the first bearing contact on a prop or
 * a person, else the ground.
 *
 * @param context The action's context.
 * @returns The support.
 */
export function HumanSupportFrame(
  context: HumanSupportFrame.IOfContext,
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
 * The one reader of the frame a body's base rests on: the ground, a prop it
 * sits or stands on (a saddle, a cart's bed, a deck), or a performer's region
 * it is borne on, with that frame's velocity and acceleration at a second.
 * Every consumer reads it here: a presented weapon aimed in the support's
 * frame, a launch inheriting the support's velocity, the rider's inertial load,
 * a borne person.
 *
 * The support is the bearing contact the action is entered on
 * (`IHumanEntryState.supports`): the seat or the feet, not a gripping hand, the
 * first one on a prop or a person, the ground when every one is on the ground.
 * The velocity and the acceleration are the central differences of the
 * support's origin at the engine's plan-time step
 * (`integrateMotionTrajectory.STEP`). A performer's region is read only at and
 * before the second evaluated (contract), so its differences are backward ones
 * over the same step.
 */
export namespace HumanSupportFrame {
  /**
   * What `HumanSupportFrame` reads of an action's context: its entry's supports
   * and its carrier's support.
   */
  export interface IOfContext {
    /** The entry's supports. */
    entry: Pick<IAutoMovieMotionHumanEntryState, "supports">;

    /** The carrier an overlay rides, with what it stands on. */
    carrier?: Pick<IAutoMovieMotionHumanActionContext.ICarrier, "support">;
  }

  /**
   * What `HumanSupportFrame.at` reads of an action's context: the entry's
   * support, a prop's frame and a performer's posed bones.
   */
  export interface IAtContext extends IOfContext {
    /** A prop's frame over film seconds. */
    prop(
      subject: string,
    ): Pick<IAutoMovieMotionHumanPropReader, "frame" | "site">;

    /** A performer's body and posed bones. */
    performer(
      subject: string,
    ): Pick<IAutoMovieMotionHumanPerformerReader, "body" | "bones">;
  }

  /**
   * What `HumanSupportFrame.board` reads of an action's context: the support
   * frames and the action's start.
   */
  export interface IBoardContext extends IAtContext {
    /** Film second of the action's time zero. */
    start: number;
  }

  /**
   * The frame an entry part already bears on. Continuing a plant keeps that
   * frame; a part with no declared contact starts on the ground.
   *
   * @param context The displayed entry's contacts.
   * @param part The contact part being continued.
   * @returns Its support frame.
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
   * displayed sole sockets. A foot on a footrest of the seat sat on is not on a
   * floor; with no foot on one the ground is the default.
   *
   * @param body The body.
   * @param entry The displayed entry.
   * @returns World metres.
   */
  export function floor(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
  ): number {
    // A foot on a footrest of the seat sat on stands on the seat, not on a
    // floor: a bar stool's rail or a scooter's deck is part of what is sat
    // on, and the seat's height is still measured from the floor under it.
    // Read as a floor, the rail made a bar stool a seat of chair height, and
    // getting up from it stood the body on the rail (measured: the hips
    // 0.34 m above the quiet stance's after getting off).
    const rests: IAutoMovieMotionHumanBase.ISeat["footrests"] =
      entry.base.kind === "seated" ? entry.base.seat?.footrests : undefined;
    const planted: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean =>
        entry.feet[side].planted && rests?.[side] === undefined,
    );
    if (planted.length === 0) return 0;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
    );
    return Math.min(
      ...planted.flatMap((side: AutoMovieHumanSide): number[] =>
        HumanFoot.sockets(body, bones, side).map(
          (socket: IAutoMovieMotionHumanFoot.ISocket): number => socket.point.y,
        ),
      ),
    );
  }
  /**
   * Refuse stepping from the ground onto a moving prop faster than the gait can
   * match: getting on is a step at a matched speed, so a support that moves
   * faster at the action's start than the gait's own speed cannot be boarded. A
   * body already on that prop is not boarding.
   *
   * @param context The action's context.
   * @param prop The prop stepped onto.
   * @param speed The gait's speed, m/s.
   * @throws {HumanRefusal} A `base` refusal on `on` with the speeds and the
   *   fix.
   */
  export function board(
    context: IBoardContext,
    prop: string,
    speed: number,
  ): void {
    const current: IAutoMovieMotionHumanContactWindow.Support =
      HumanSupportFrame(context);
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
   * @param named A support named outright, such as the prop a walk is to step
   *   onto; the one the action is entered on when absent.
   * @returns The frame.
   */
  export function at(
    context: IAtContext,
    seconds: number,
    named?: IAutoMovieMotionHumanContactWindow.Support,
  ): IAutoMovieMotionHumanSupportFrame.IFrame {
    const support: IAutoMovieMotionHumanContactWindow.Support =
      named ?? HumanSupportFrame(context);
    if (support.kind === "ground")
      return {
        support,
        position: { x: 0, y: support.height ?? 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
      };
    const frame = (t: number): IAutoMovieRigidTransform => {
      if (support.kind === "prop") {
        const reader: ReturnType<IAtContext["prop"]> = context.prop(
          support.subject,
        );
        return support.point === undefined
          ? reader.frame(t)
          : (reader.site?.(support.point, t) ?? reader.frame(t));
      }
      const other: ReturnType<HumanSupportFrame.IAtContext["performer"]> =
        context.performer(support.subject);
      const bone: AutoMovieHumanoidBone =
        "bone" in support
          ? support.bone
          : other.body.surfaces.regions[support.region].bone;
      const posed: IAutoMovieResolvedBone = other.bones(t).get(bone)!;
      return HumanPropFrame.bone(posed);
    };
    const h: number = integrateMotionTrajectory.STEP;
    const now: IAutoMovieRigidTransform = frame(seconds);

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
