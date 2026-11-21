import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanBall } from "../ballStrike/HumanBall";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGlove } from "./HumanGlove";
import { catchObjectApproach } from "./catchObjectApproach";
import { catchObjectFingers } from "./catchObjectFingers";

/**
 * Catching an object thrown by another action: the hands meet it where its
 * path enters the reach, give with it, and bring it to the chest.
 *
 * The goal is an interception. The throw's plan carries its launch
 * (`throwObject.of`), so the path is known in closed form, drag-free. The
 * catch point is where the path first comes within `REACH` arm lengths
 * ahead of the catcher's root along its heading (provisional), and the
 * contact instant the path's time there; a path that never comes so near,
 * or a point the arms cannot reach from the shoulders, is refused. With two
 * hands the palms take the object from both sides, each palm on its surface
 * across the catcher's left-right axis; with one the palm takes it from
 * behind, facing the way it comes, or with a worn glove (`glove`) the hand
 * turned as that palm would be and moved so the glove's pocket meets it. The
 * fingers take the turn about the palm's normal (`ROLLS`, upward first) the
 * arm holds at the contact with the least strain
 * (`AutoMovieMotionHumanBend.strain`), so the wrist's range decides it. The ball's size is the
 * ball's own (`ball`, `HumanBall`). The hands travel there on minimum-jerk
 * progress over the aimed movement time to an object of its size (McIntosh
 * et al. 2018, `AutoMovieMotionHumanTiming.aimed`), arriving at contact;
 * the anticipatory `prepare` instant is 100 ms before impact (Lacquaniti and
 * Maioli 1989, J Neurosci 9:134). After contact the hands give `GIVE` along
 * the object's velocity over `GIVE_TIME` (the issue's 0.05 to 0.15 m,
 * provisional), which is `secured`, then carry it to before the sternum and
 * hold it. Events: `reach`, `prepare`, `contact`, `secured`, `held`.
 *
 * The catch may start any time up to that `prepare` instant: with the throw,
 * or later, as when the thrower cuts its own throw at the release to catch
 * what it tossed (a juggle, a rhythmic toss).
 *
 * Not yet: hand closure timed by optical expansion (Savelsbergh et al.
 * 1991), a running catch (McLeod and Dienes 1996), a fumble, the catch
 * against the chest, and a held prop handed from the throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interception, the hands' places, their timing with sources, the give, the events, the refusals and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record composed of arm rows over a standing base, reading the throw's launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the object reader and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The path comes from the throw's plan, never typed.
 */
export namespace catchObject {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "catchObject";

  /** Cancel table: a secured catch is thrown back, stood with, or walked with. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    ballSport: [
      { window: ["secured", 1], kind: "inertialize", entry: 0, blend: 0.2 },
    ],
    throwObject: [
      { window: ["secured", 1], kind: "inertialize", entry: 0, blend: 0.2 },
    ],
    stand: [
      {
        window: ["secured", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: ["secured", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /** May be performed over a carrier, such as seated or while another action carries the body: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /** How far ahead of the root the object is met, arm lengths (`catchObjectApproach.REACH`). */
  export const REACH: number = catchObjectApproach.REACH;

  /** The height a self-tossed object is caught at on its way down (`catchObjectApproach.TOSS`). */
  export const TOSS: number = catchObjectApproach.TOSS;

  /** How far the hands give with the object after contact, metres (provisional). */
  export const GIVE: number = 0.1;

  /** The turns of the fingers about the palm's normal tried on the ball, degrees from upward: the whole way round in steps of 30. */
  export const ROLLS: readonly number[] = [
    0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180,
  ];

  /** How long the give takes, seconds (provisional). */
  export const GIVE_TIME: number = 0.15;

  /** A staged intercept read from the canonical prop at one authored second. */
  export interface IInterception {
    /** The contact's action-local second. */
    contact: number;

    /** World velocity immediately before contact, in metres per second. */
    speed: IAutoMovieVector3;

    /** The ball's world centre on the action clock up to contact. */
    before(seconds: number): IAutoMovieVector3;
  }
  /**
   * Plan a catch.
   *
   * @param context The action's context.
   * @param interception An optional realized interception supplied by `stageCatch`.
   * @returns The plan.
   * @throws {HumanRefusal} When the anchor is not a throw, the ball declares no size, the glove is not worn on the one catching hand or has no pocket, the path never comes within reach, or the catch would start before the action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the original throw/ball/glove/reach/start refusals, returned object path and composed hand plan; the namespace specifies interception, give and contact timing.
   * @evidence contracts/development/implementation.md#principled-implementation The interception is the root of the path's distance ahead, linear in the flight's time because a drag-free flight keeps its horizontal velocity; a path that does not close on the catcher never comes within reach, and one that meets the reach line far below the arms is refused by the shoulders' reach; each hand's twelve original palm rolls retain their actual elbow solve and separately ranked strain sweep before the same give/carry targets are composed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Interception/timing and the shared object path precede each hand's rank loop and arm primitive. HumanHandTarget's shared frame/placement owner separates actual palm orientation from the glove correction and actual elbow searches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all rolls, both original Bend sweeps, strict strain tie, pocket-correction-before-wrist subtraction order, phase paths, contacts, refusal bounds and timing; no achieved pose replaces the original target.
   * @evidence contracts/development/implementation.md#efficient-algorithms Entry FK requests only actual shoulders/hands. Each hand's rank loop prepares its fixed palm offset/rest basis and fixed trunk Bend geometry once across all twelve rolls, while all actual orientations, complete candidate sweeps and runtime targets remain. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed rank geometry and final hand-surface metadata are shared without answers; each roll/current target remains actual. Runtime Frame FK loans reach only actual raw sternum reads, and a public object call lends one local getter through its original full composition and final centre observation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Rank-loop geometry releases before its hand primitive returns; the plan owns original launch/clock and constant-size hand/path metadata. Each runtime loan/local object getter releases per synchronous call; no candidate fit, sampled pose or query history is retained.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCatchObject.IParams>,
    interception?: IInterception,
  ): IAutoMovieMotionHumanCatchObject.IPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const radius: number = HumanBall.of(
      context,
      context.params.ball,
      context.start,
      "ball",
    ).radius;
    const neutral: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { ...neutral.root, y: 0 },
      yaw: neutral.yaw,
    };

    const timing: IInterception =
      interception ?? catchObjectApproach.of(context, frame, arm);
    const contact: number = timing.contact;
    // A staged overlay may meet the ball from a carrier such as an immersed
    // body. Read its shoulders and elbow geometry at the interception.
    const standing: IAutoMovieMotionHumanPosture =
      interception === undefined
        ? neutral
        : (context.carrier?.posture(contact) ?? neutral);
    const meet: IAutoMovieVector3 = timing.before(contact);
    const along: IAutoMovieVector3 = Vector3.normalize(timing.speed);
    const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> = new Set([
      "leftUpperArm",
      "rightUpperArm",
    ]);
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        standing,
        undefined,
        {},
        undefined,
        shoulderBones,
      ).pose,
      undefined,
      shoulderBones,
    );
    const shoulders: IAutoMovieVector3 = Vector3.lerp(
      bones.get("leftUpperArm")!.worldPosition,
      bones.get("rightUpperArm")!.worldPosition,
      0.5,
    );
    if (
      Vector3.length(Vector3.subtract(meet, shoulders)) >
      arm + m.hand + m.shoulderHalfWidth
    )
      throw new HumanRefusal({
        kind: "reach",
        axis: "from",
        value: context.params.from,
        reason: `the object passes ${Vector3.length(Vector3.subtract(meet, shoulders)).toFixed(2)} m from the shoulders, beyond the arms`,
        fix: "stand on the throw's path, or aim the throw at the catcher",
      });

    // The clock on the catcher's own time, contact at the path's instant.
    const travel: number = AutoMovieMotionHumanTiming.aimed(
      Vector3.length(Vector3.subtract(meet, shoulders)),
      2 * radius,
    );
    const reach: number = Math.max(0, contact - travel);
    if (contact - 0.1 < 0)
      throw new HumanRefusal({
        kind: "base",
        axis: "from",
        value: context.params.from,
        reason: `the catch starts ${(-contact + 0.1).toFixed(2)} s too late to prepare`,
        fix: "start the catch at least 0.1 s before the object arrives: with the throw, or cut from the thrower's own throw at its release",
      });
    const secured: number = contact + GIVE_TIME;
    const held: number = secured + 0.4;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(held + 0.6, [
      { name: "reach", seconds: reach },
      { name: "prepare", seconds: Math.max(reach, contact - 0.1) },
      { name: "contact", seconds: contact },
      { name: "secured", seconds: secured },
      { name: "held", seconds: held },
    ]);
    const duration: number = clock.duration;

    // The object: on its path before contact, given with after it, then
    // carried to before the sternum.
    const given: IAutoMovieVector3 = Vector3.add(
      meet,
      Vector3.scale(along, GIVE),
    );
    let sternumAt: ReturnType<typeof HumanTrunk.prepareRegion> | undefined;
    const object: (
      seconds: number,
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ) => IAutoMovieVector3 = (
      seconds: number,
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieVector3 => {
      if (seconds < contact) return timing.before(seconds);
      if (seconds === contact) return meet;
      if (seconds <= secured)
        return Vector3.lerp(
          meet,
          given,
          clock.progress("contact", "secured", seconds),
        );
      sternumAt ??= HumanTrunk.prepareRegion(body, "sternum");
      const sternum: ReturnType<typeof HumanTrunk.region> = sternumAt(
        posture,
        resolution,
      );
      const before: IAutoMovieVector3 = Vector3.add(
        sternum.point,
        Vector3.scale(sternum.normal, radius + 0.15 * arm),
      );
      return Vector3.lerp(
        given,
        before,
        clock.progress("secured", "held", seconds),
      );
    };

    // Each palm on the object's surface: from the sides with two hands, from
    // behind with one.
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
      { x: 1, y: 0, z: 0 },
    );
    const sides: AutoMovieHumanSide[] =
      (context.params.hands ?? "two") === "two"
        ? ["left", "right"]
        : [context.params.side ?? "right"];
    const pocket: IAutoMovieVector3 | undefined =
      context.params.glove === undefined
        ? undefined
        : HumanGlove.pocket(context, context.params.glove, sides);
    const entryBones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set(
        sides.map(
          (side: AutoMovieHumanSide): AutoMovieHumanoidBone => `${side}Hand`,
        ),
      ),
    );
    // The hand on the ball: its palm's target, or with a glove the palm's
    // turn moved so the pocket meets the ball.
    const pocketPoint: (
      back: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ) => IAutoMovieVector3 = (
      back: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ): IAutoMovieVector3 =>
      pocket === undefined
        ? back
        : Vector3.subtract(back, Quaternion.rotateVector(rotation, pocket));
    const hand: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanPrimitive => {
      const outward: IAutoMovieVector3 =
        sides.length === 2
          ? Vector3.scale(left, side === "left" ? 1 : -1)
          : along;
      const fingers: IAutoMovieVector3 = catchObjectFingers({
        body,
        standing,
        yaw: frame.yaw,
        side,
        outward,
        meet,
        radius,
        rolls: ROLLS,
        pocketPoint,
      });
      const prepared: ReturnType<
        typeof AutoMovieMotionHumanTarget.prepareHand
      > = AutoMovieMotionHumanTarget.prepareHand(body, side, outward, {
        surface: "palm",
        shape: "relaxed",
        forward: fingers,
      });
      let corrected:
        | ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareTarget>
        | undefined;
      return AutoMovieMotionHumanArm.move({
        body,
        side,
        from: 0,
        to: duration,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          entryBones,
          {
            origin: context.entry.posture.root,
            yaw: context.entry.posture.yaw,
          },
          side,
          "palm",
        ),
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
        ): IAutoMovieMotionHumanArmTarget.ITarget => {
          const centre: IAutoMovieVector3 = object(
            Math.max(seconds, contact),
            posture,
            resolution,
          );
          const back: IAutoMovieVector3 = Vector3.add(
            centre,
            Vector3.scale(outward, radius),
          );
          const target: IAutoMovieMotionHumanArmTarget.ITarget = prepared(
            posture,
            back,
          );
          if (pocket === undefined) return target;
          corrected ??= AutoMovieMotionHumanArmTarget.prepareTarget(
            body,
            side,
            "palm",
            "relaxed",
          );
          return corrected({
            ...target,
            point: pocketPoint(back, target.rotation),
          });
        },
        weight: (seconds: number): number =>
          minimumJerk.share(clock.linear("reach", "contact", seconds)),
      });
    };

    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    // Each catching arm is one admitted course: it reaches the ball by the
    // contact and follows the give and the carry, never refitted per second.
    const composed: IAutoMovieMotionHumanActionPlan = sides.reduce(
      (
        plan: IAutoMovieMotionHumanActionPlan,
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanActionPlan =>
        courseArmGoal({
          body,
          plan,
          side,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          span: { start: 0, ready: contact, relax: duration, end: duration },
        }),
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "contact",
        primitives: sides.map(hand),
      }),
    );
    return {
      ...composed,
      object: (seconds: number): IAutoMovieVector3 => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        return object(
          seconds,
          composed.posture(seconds, undefined, resolution),
          resolution,
        );
      },
    };
  }
}
