import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportAim,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanSupportFrame,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanSupportAim } from "./HumanSupportAim";
import { HumanSupportFrame } from "./HumanSupportFrame";

/*
 * The carry from a start to a second of a support whose frame a function gives.
 * Parameter frame: The support's world frame at a film second.
 * Parameter start: The film second the posture was planned at.
 * Parameter seconds: The film second carried to.
 * Returns: The carry.
 */
export function HumanSupportCarry(
  frame: (seconds: number) => IAutoMovieRigidTransform,
  start: number,
  seconds: number,
): IAutoMovieMotionHumanSupportCarry.ICarry {
  const first: IAutoMovieRigidTransform = frame(start);
  const now: IAutoMovieRigidTransform = frame(seconds);
  const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
    AutoMovieEngineQuaternion.multiply(
      now.rotation,
      AutoMovieEngineQuaternion.inverse(first.rotation),
    ),
  );
  return {
    point: (p: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieEngineVector3.add(
        now.position,
        AutoMovieEngineQuaternion.rotateVector(
          turn,
          AutoMovieEngineVector3.subtract(p, first.position),
        ),
      ),
    turn,
    yaw: yawOf(turn),
  };
}

/*
 * The one owner of goals in a moving support's frame: a posture planned in the
 * world at an action's start, expressed in the support's frame there and
 * carried back to the world at every second by the support's rigid motion since
 * then. A stance on a cart's bed, a bow held on its target from a cantering
 * horse and a carbine presented from a moving car all plan once at their start
 * and are carried this way, so a goal on the support stays on it and the plan
 * stays a pure function of its seconds.
 *
 * The carry is the rigid transform `D(t) = F(t) F(start)^-1` of the support's
 * frame `F`: a point `p` goes to `F(t) F(start)^-1 p`, a rotation is turned by
 * the support's turn, and the heading by that turn's yaw about the vertical. A
 * goal attached to a bone (`HumanPosture.IGoal.on`) rides its bone already and
 * is left alone. On the ground the carry is the identity, so nothing changes
 * there.
 */
export namespace HumanSupportCarry {
  /*
   * Blend the rigid carries that share a staging frame at entry. End weights
   * preserve the exact source or destination carry. Intermediate weights
   * interpolate the carried anchor and take the shortest turn.
   * Parameter from: The current support's carry from entry.
   * Parameter to: The next support's carry from the same entry.
   * Parameter anchor: An entry-world point near the goals being carried, metres.
   * Parameter weight: The destination weight from zero to one.
   * Returns: A rigid carry of points, turns and headings.
   */
  export function blend(
    from: IAutoMovieMotionHumanSupportCarry.ICarry,
    to: IAutoMovieMotionHumanSupportCarry.ICarry,
    anchor: IAutoMovieVector3,
    weight: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry {
    if (weight === 0) return from;
    if (weight === 1) return to;
    const carriedAnchor: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
      from.point(anchor),
      to.point(anchor),
      weight,
    );
    const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
      from.turn,
      to.turn,
      weight,
    );
    return {
      point: (p: IAutoMovieVector3): IAutoMovieVector3 =>
        AutoMovieEngineVector3.add(
          carriedAnchor,
          AutoMovieEngineQuaternion.rotateVector(
            turn,
            AutoMovieEngineVector3.subtract(p, anchor),
          ),
        ),
      turn,
      yaw: yawOf(turn),
    };
  }

  /*
   * A posture carried: its root, its heading and every limb goal not attached
   * to a bone moved by the carry; joint angles are the body's own and stay.
   * Contacts and task-limit points are end-joint-local offsets and remain
   * unchanged by the world's rigid motion.
   * Parameter carry: The carry.
   * Parameter posture: The posture planned at the start.
   * Returns: The carried posture.
   */
  export function posture(
    carry: IAutoMovieMotionHumanSupportCarry.ICarry,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const limb of LIMBS) {
      const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
      if (goal === undefined) continue;
      limbs[limb] =
        goal.on !== undefined
          ? goal
          : {
              ...goal,
              point: carry.point(goal.point),
              bend: carry.point(goal.bend),
              ...(goal.rotation === undefined
                ? {}
                : {
                    rotation: AutoMovieEngineQuaternion.normalize(
                      AutoMovieEngineQuaternion.multiply(
                        carry.turn,
                        goal.rotation,
                      ),
                    ),
                  }),
            };
    }
    return {
      ...posture,
      root: carry.point(posture.root),
      yaw: posture.yaw + carry.yaw,
      limbs,
    };
  }

  /*
   * An action's entry as the prop it is planned on carries it: the pelvis's and
   * each foot's velocity and acceleration less the prop's own at the action's
   * start (`HumanSupportFrame.at`, the rate of the prop's origin), places and
   * joint rates unchanged. A plan made on the prop as it stood at the start and
   * then carried by its motion (`on`) reads the body's motion on the prop, not
   * in the world: a body standing still on a wagon rolling at 2 m/s enters a
   * walk on the bed at rest, not already walking at 2 m/s, or the carry would
   * add the wagon's motion a second time.
   * Parameter context: The action's context.
   * Parameter bearing: The prop identifier or the already measured bearing frame.
   * Returns: The entry relative to the prop's motion.
   */
  export function entry(
    context: Pick<IAutoMovieMotionHumanActionContext, EntryContext>,
    bearing: string | IAutoMovieMotionHumanSupportFrame.IFrame,
  ): IAutoMovieMotionHumanEntryState {
    const support: IAutoMovieMotionHumanSupportFrame.IFrame =
      typeof bearing === "string"
        ? HumanSupportFrame.at(context, context.start, {
            kind: "prop",
            subject: bearing,
          })
        : bearing;
    const entered: IAutoMovieMotionHumanEntryState = context.entry;
    const foot = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanEntryState.IFoot => ({
      ...entered.feet[side],
      velocity: AutoMovieEngineVector3.subtract(
        entered.feet[side].velocity,
        support.velocity,
      ),
      acceleration: AutoMovieEngineVector3.subtract(
        entered.feet[side].acceleration,
        support.acceleration,
      ),
    });
    return {
      ...entered,
      velocity: {
        ...entered.velocity,
        linear: AutoMovieEngineVector3.subtract(
          entered.velocity.linear,
          support.velocity,
        ),
      },
      acceleration: AutoMovieEngineVector3.subtract(
        entered.acceleration,
        support.acceleration,
      ),
      feet: { left: foot("left"), right: foot("right") },
    };
  }

  /*
   * A plan made on a named prop carried by that prop's motion: a walk along a
   * wagon's bed planned on the bed as it stood at the walk's start, each foot
   * planted on the prop.
   * Parameter context: The action's context.
   * Parameter plan: The plan made in the world at the start.
   * Parameter prop: The prop the body stands or walks on.
   * Parameter site: Its named bearing frame, or the whole prop frame when omitted.
   * Returns: The carried plan with its plants on the prop. The prop frame does
   * not certify a stationary window in world coordinates.
   */
  export function on(
    context: Pick<IAutoMovieMotionHumanActionContext, OnContext>,
    plan: IAutoMovieMotionHumanActionPlan,
    prop: string,
    site?: string,
  ): IAutoMovieMotionHumanActionPlan {
    const support: IAutoMovieMotionHumanContactWindow.Support = {
      kind: "prop",
      subject: prop,
      ...(site === undefined ? {} : { point: site }),
    };
    const frame = (seconds: number): IAutoMovieRigidTransform => {
      const reader: ReturnType<typeof context.prop> = context.prop(prop);
      return site === undefined
        ? reader.frame(seconds)
        : (reader.site?.(site, seconds) ?? reader.frame(seconds));
    };
    const { still: _still, legsStill: _legsStill, ...moving } = plan;
    return {
      ...moving,
      contacts: plan.contacts.map(
        (
          c: IAutoMovieMotionHumanActionPlan["contacts"][number],
        ): IAutoMovieMotionHumanActionPlan["contacts"][number] =>
          c.kind === "plant" && c.support.kind === "ground"
            ? { ...c, support }
            : c,
      ),
      posture: (
        seconds: number,
        channels?: readonly AutoMovieMotionHumanChannel[],
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture =>
        posture(
          HumanSupportCarry(frame, context.start, context.start + seconds),
          plan.posture(seconds, channels, resolution, projection),
        ),
    };
  }

  /*
   * A plan carried by the support its action is entered on
   * (`HumanSupportFrame`), claiming the channels it writes over its carrier:
   * the plan an act made in the world at its start, kept on the support.
   *
   * With an aim, the line planned at the start is re-taken on its world target
   * at every second (`HumanSupportAim`), and an aim the trunk and the arms
   * cannot keep at a frame of the act is refused here. The plan's launches (a
   * shot) are carried to their seconds with it, so a shot leaves the muzzle
   * where the displayed weapon is.
   * Parameter context: The action's context.
   * Parameter plan: The plan made at the start.
   * Parameter channels: The channels the plan claims over its carrier.
   * Parameter aim: The line kept on a world target; none when absent.
   * Returns: The carried plan. The ground branch keeps the input's stationarity
   * bounds; another support can move its world goals.
   * When keeping the aim asks the arms to present past
   * their bound (`HumanSupportAim.check`).
   */
  export function plan(
    context: Pick<IAutoMovieMotionHumanActionContext, PlanContext>,
    plan: IAutoMovieMotionHumanActionPlan,
    channels: NonNullable<IAutoMovieMotionHumanActionPlan["channels"]>,
    aim?: IAutoMovieMotionHumanSupportAim.IAim,
  ): IAutoMovieMotionHumanActionPlan {
    // On the ground there is nothing to carry: the plan is kept as made.
    if (HumanSupportFrame(context).kind === "ground")
      return { ...plan, channels };
    const frame = (seconds: number): IAutoMovieRigidTransform => {
      const at: IAutoMovieMotionHumanSupportFrame.IFrame = HumanSupportFrame.at(
        context,
        seconds,
      );
      return { position: at.position, rotation: at.rotation };
    };
    const carryAt = (
      seconds: number,
    ): IAutoMovieMotionHumanSupportCarry.ICarry =>
      HumanSupportCarry(frame, context.start, context.start + seconds);
    // The root and the heading are the carrier's, which its own plan has
    // already carried; only the goals this plan made at its start ride on.
    const made = (
      seconds: number,
      requested?: readonly AutoMovieMotionHumanChannel[],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const own: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        aim === undefined ? requested : undefined,
        resolution,
        projection,
      );
      return {
        ...posture(carryAt(seconds), own),
        root: own.root,
        yaw: own.yaw,
      };
    };
    const carried = (
      seconds: number,
      requested?: readonly AutoMovieMotionHumanChannel[],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      aim === undefined
        ? made(seconds, requested, resolution, projection)
        : HumanSupportAim.posture(
            carryAt(seconds),
            made(seconds, requested, resolution, projection),
            aim,
          );
    if (aim !== undefined)
      HumanSupportAim.check(made, carryAt, aim, plan.duration);
    const { still: _still, legsStill: _legsStill, ...moving } = plan;
    return {
      ...moving,
      channels,
      posture: carried,
      ...(plan.launches === undefined
        ? {}
        : {
            launches: plan.launches.map(
              (l: IAutoMovieMotionPropLaunch): IAutoMovieMotionPropLaunch =>
                launch(context, frame, l),
            ),
          }),
    };
  }

  /*
   * A launch planned at the start carried to its second: its point and rotation
   * by the carry, its velocity relative to the support turned by the carry's
   * turn, the support's own velocity there (which the act already added) kept.
   */
  function launch(
    context: Pick<IAutoMovieMotionHumanActionContext, LaunchContext>,
    frame: (seconds: number) => IAutoMovieRigidTransform,
    l: IAutoMovieMotionPropLaunch,
  ): IAutoMovieMotionPropLaunch {
    const carry: IAutoMovieMotionHumanSupportCarry.ICarry = HumanSupportCarry(
      frame,
      context.start,
      context.start + l.seconds,
    );
    const support: IAutoMovieVector3 = HumanSupportFrame.at(
      context,
      context.start + l.seconds,
    ).velocity;
    return {
      ...l,
      point: carry.point(l.point),
      velocity: AutoMovieEngineVector3.add(
        AutoMovieEngineQuaternion.rotateVector(
          carry.turn,
          AutoMovieEngineVector3.subtract(l.velocity, support),
        ),
        support,
      ),
      ...(l.rotation === undefined
        ? {}
        : {
            rotation: AutoMovieEngineQuaternion.normalize(
              AutoMovieEngineQuaternion.multiply(carry.turn, l.rotation),
            ),
          }),
    };
  }
}

/*
 * Goals that can be carried through a prop's world motion.
 */
const LIMBS: readonly AutoMovieHumanLimb[] = [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/*
 * Read the turn's heading in degrees around world up.
 */
function yawOf(turn: IAutoMovieQuaternion): number {
  const ahead: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    turn,
    {
      x: 0,
      y: 0,
      z: 1,
    },
  );
  return (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
}

/*
 * The alternatives of `LaunchContext`'s site.
 */
type LaunchContext = "entry" | "prop" | "performer" | "start";

/*
 * The alternatives of `PlanContext`'s site.
 */
type PlanContext = "entry" | "prop" | "performer" | "start";

/*
 * The alternatives of `OnContext`'s site.
 */
type OnContext = "prop" | "start";

/*
 * The alternatives of `EntryContext`'s site.
 */
type EntryContext = "entry" | "prop" | "performer" | "start";
