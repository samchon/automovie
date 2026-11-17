import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportAim,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanSupportFrame,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanSupportAim } from "./HumanSupportAim";
import { HumanSupportFrame } from "./HumanSupportFrame";

/**
 * The one owner of goals in a moving support's frame (#3491): a posture
 * planned in the world at an action's start, expressed in the support's
 * frame there and carried back to the world at every second by the
 * support's rigid motion since then. A stance on a cart's bed, a bow held on
 * its target from a cantering horse and a carbine presented from a moving
 * car all plan once at their start and are carried this way, so a goal on
 * the support stays on it and the plan stays a pure function of its seconds.
 *
 * The carry is the rigid transform `D(t) = F(t) F(start)^-1` of the
 * support's frame `F`: a point `p` goes to `F(t) F(start)^-1 p`, a rotation
 * is turned by the support's turn, and the heading by that turn's yaw about
 * the vertical. A goal attached to a bone (`HumanPosture.IGoal.on`) rides
 * its bone already and is left alone. On the ground the carry is the
 * identity, so nothing changes there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is carried, by which transform, what is left alone and why the plan stays pure.
 * @evidence contracts/development/design.md#principled-representation A rigid transform of SE(3) between the support's frame at the start and at a second, applied to a posture's world quantities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The carry by a frame function, a posture carried, and a plan carried with the channels it claims and the aim it keeps (`HumanSupportAim`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The support's frame is read through its one reader (`HumanSupportFrame`) or the prop's own frame; nothing is extrapolated.
 */
export namespace HumanSupportCarry {

  /**
   * The carry from a start to a second of a support whose frame a function
   * gives.
   *
   * @param frame The support's world frame at a film second.
   * @param start The film second the posture was planned at.
   * @param seconds The film second carried to.
   * @returns The carry.
   */
  export function of(
    frame: (seconds: number) => IAutoMovieRigidTransform,
    start: number,
    seconds: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry {
    const first: IAutoMovieRigidTransform = frame(start);
    const now: IAutoMovieRigidTransform = frame(seconds);
    const turn: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(now.rotation, Quaternion.inverse(first.rotation)),
    );
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
      x: 0,
      y: 0,
      z: 1,
    });
    return {
      point: (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          now.position,
          Quaternion.rotateVector(turn, Vector3.subtract(p, first.position)),
        ),
      turn,
      yaw: (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI,
    };
  }

  /**
   * A posture carried: its root, its heading and every limb goal not
   * attached to a bone moved by the carry; joint angles are the body's own
   * and stay. Contacts and task-limit points are end-joint-local offsets
   * and remain unchanged by the world's rigid motion.
   *
   * @param carry The carry.
   * @param posture The posture planned at the start.
   * @returns The carried posture.
   */
  export function posture(
    carry: IAutoMovieMotionHumanSupportCarry.ICarry,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const [limb, goal] of Object.entries(posture.limbs) as [
      keyof IAutoMovieMotionHumanPosture["limbs"],
      IAutoMovieHumanLimbGoal,
    ][])
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
                    rotation: Quaternion.normalize(
                      Quaternion.multiply(carry.turn, goal.rotation),
                    ),
                  }),
            };
    return {
      ...posture,
      root: carry.point(posture.root),
      yaw: posture.yaw + carry.yaw,
      limbs,
    };
  }

  /**
   * A plan made on a named prop carried by that prop's motion: a walk along
   * a wagon's bed planned on the bed as it stood at the walk's start, each
   * foot planted on the prop.
   *
   * @param context The action's context.
   * @param plan The plan made in the world at the start.
   * @param prop The prop the body stands or walks on.
   * @returns The carried plan, its plants on the prop.
   */
  export function on(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
    plan: IAutoMovieMotionHumanActionPlan,
    prop: string,
  ): IAutoMovieMotionHumanActionPlan {
    const frame = (seconds: number): IAutoMovieRigidTransform =>
      context.prop(prop).frame(seconds);
    return {
      ...plan,
      contacts: plan.contacts.map((c) =>
        c.kind === "plant" && c.support.kind === "ground"
          ? { ...c, support: { kind: "prop" as const, subject: prop } }
          : c,
      ),
      posture: (
        seconds: number,
        channels?: readonly AutoMovieMotionHumanChannel[],
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture =>
        posture(
          of(frame, context.start, context.start + seconds),
          plan.posture(seconds, channels, resolution, projection),
        ),
    };
  }

  /**
   * A plan carried by the support its action is entered on
   * (`HumanSupportFrame`), claiming the channels it writes over its carrier:
   * the plan an act made in the world at its start, kept on the support.
   *
   * With an aim, the line planned at the start is re-taken on its world
   * target at every second (`HumanSupportAim`), and a trunk twist out of
   * range at a frame of the act is refused here. The plan's launches (a
   * shot) are carried to their seconds with it, so a shot leaves the muzzle
   * where the displayed weapon is.
   *
   * @param context The action's context.
   * @param plan The plan made at the start.
   * @param channels The channels the plan claims over its carrier.
   * @param aim The line kept on a world target; none when absent.
   * @returns The carried plan.
   * @throws {HumanRefusal} When keeping the aim twists the trunk out of its range (`HumanSupportAim.check`).
   */
  export function plan(
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "entry" | "prop" | "performer" | "start"
    >,
    plan: IAutoMovieMotionHumanActionPlan,
    channels: NonNullable<IAutoMovieMotionHumanActionPlan["channels"]>,
    aim?: IAutoMovieMotionHumanSupportAim.IAim,
  ): IAutoMovieMotionHumanActionPlan {
    // On the ground there is nothing to carry: the plan is kept as made.
    if (HumanSupportFrame.of(context).kind === "ground")
      return { ...plan, channels };
    const frame = (seconds: number): IAutoMovieRigidTransform => {
      const at: IAutoMovieMotionHumanSupportFrame.IFrame = HumanSupportFrame.at(
        context,
        seconds,
      );
      return { position: at.position, rotation: at.rotation };
    };
    const carried = (
      seconds: number,
      requested?: readonly AutoMovieMotionHumanChannel[],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const carry: IAutoMovieMotionHumanSupportCarry.ICarry = of(frame, context.start, context.start + seconds);
      // The root and the heading are the carrier's, which its own plan has
      // already carried; only the goals this plan made at its start ride on.
      const own: IAutoMovieMotionHumanPosture = plan.posture(seconds, aim === undefined ? requested : undefined, resolution, projection);
      const made: IAutoMovieMotionHumanPosture = {
        ...posture(carry, own),
        root: own.root,
        yaw: own.yaw,
      };
      return aim === undefined
        ? made
        : HumanSupportAim.posture(carry, made, aim);
    };
    if (aim !== undefined) HumanSupportAim.check(carried, plan.duration);
    return {
      ...plan,
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

  /**
   * A launch planned at the start carried to its second: its point and
   * rotation by the carry, its velocity relative to the support turned by
   * the carry's turn, the support's own velocity there (which the act
   * already added) kept.
   */
  function launch(
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "entry" | "prop" | "performer" | "start"
    >,
    frame: (seconds: number) => IAutoMovieRigidTransform,
    l: IAutoMovieMotionPropLaunch,
  ): IAutoMovieMotionPropLaunch {
    const carry: IAutoMovieMotionHumanSupportCarry.ICarry = of(frame, context.start, context.start + l.seconds);
    const support: IAutoMovieVector3 = HumanSupportFrame.at(
      context,
      context.start + l.seconds,
    ).velocity;
    return {
      ...l,
      point: carry.point(l.point),
      velocity: Vector3.add(
        Quaternion.rotateVector(
          carry.turn,
          Vector3.subtract(l.velocity, support),
        ),
        support,
      ),
      ...(l.rotation === undefined
        ? {}
        : {
            rotation: Quaternion.normalize(
              Quaternion.multiply(carry.turn, l.rotation),
            ),
          }),
    };
  }
}
