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
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanBall } from "../../ballStrike/HumanBall";
import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTarget } from "../../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { courseArmAtPace } from "../../compose/internal/courseArmAtPace";
import { HumanTrunk } from "../../everyday/HumanTrunk";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanGlove } from "../HumanGlove";
import { catchObjectApproach } from "./catchObjectApproach";
import { catchObjectFingers } from "./catchObjectFingers";

/**
 * Catching an object thrown by another action: the hands meet it where its path
 * enters the reach, give with it, and bring it to the chest.
 *
 * The goal is an interception. The throw's plan carries its launch
 * (`readThrowObjectLaunch`), so the path is known in closed form, drag-free.
 * The catch point is where the path first comes within `REACH` arm lengths
 * ahead of the catcher's root along its heading (provisional), and the contact
 * instant the path's time there; a path that never comes so near, or a point
 * the arms cannot reach from the shoulders, is refused. With two hands the
 * palms take the object from both sides, each palm on its surface across the
 * catcher's left-right axis; with one the palm takes it from behind, facing the
 * way it comes, or with a worn glove (`glove`) the hand turned as that palm
 * would be and moved so the glove's pocket meets it. The fingers take the turn
 * about the palm's normal (`ROLLS`, upward first) the arm holds at the contact
 * with the least strain (`AutoMovieMotionHumanBend.strain`), so the wrist's
 * range decides it. The ball's size is the ball's own (`ball`, `HumanBall`).
 * The hands travel there on minimum-jerk progress over the aimed movement time
 * to an object of its size (McIntosh et al. 2018,
 * `AutoMovieMotionHumanTiming.aimed`), arriving at contact; the anticipatory
 * `prepare` instant is 100 ms before impact (Lacquaniti and Maioli 1989, J
 * Neurosci 9:134). After contact the hands give `GIVE` along the object's
 * velocity over `GIVE_TIME` (the issue's 0.05 to 0.15 m, provisional), which is
 * `secured`, then carry it to before the sternum and hold it. Events: `reach`,
 * `prepare`, `contact`, `secured`, `held`.
 *
 * The catch may start any time up to that `prepare` instant: with the throw, or
 * later, as when the thrower cuts its own throw at the release to catch what it
 * tossed (a juggle, a rhythmic toss).
 *
 * Not yet: hand closure timed by optical expansion (Savelsbergh et al. 1991), a
 * running catch (McLeod and Dienes 1996), a fumble, the catch against the
 * chest, and a held prop handed from the throw.
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

  /**
   * May be performed over a carrier, such as seated or while another action
   * carries the body: it claims only the parts it moves.
   */
  export const overlay: boolean = true;

  /**
   * How far ahead of the root the object is met, arm lengths
   * (`catchObjectApproach.REACH`).
   */
  export const REACH: number = catchObjectApproach.REACH;

  /**
   * The height a self-tossed object is caught at on its way down
   * (`catchObjectApproach.TOSS`).
   */
  export const TOSS: number = catchObjectApproach.TOSS;

  /** How far the hands give with the object after contact, metres (provisional). */
  export const GIVE: number = 0.1;

  /**
   * The turns of the fingers about the palm's normal tried on the ball, degrees
   * from upward: the whole way round in steps of 30.
   */
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
   * @param interception An optional realized interception supplied by
   *   `stageCatch`.
   * @returns The plan.
   * @throws {HumanRefusal} When the anchor is not a throw, the ball declares no
   *   size, the glove is not worn on the one catching hand or has no pocket,
   *   the path never comes within reach, or the catch would start before the
   *   action.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCatchObject.IParams>,
    interception?: IInterception,
  ): IAutoMovieMotionHumanCatchObject.IPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const radius: number = HumanBall(
      context,
      context.params.ball,
      context.start,
      "ball",
    ).radius;
    const neutral: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: 1 } })
      .posture(0);
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { ...neutral.root, y: 0 },
      yaw: neutral.yaw,
    };

    const timing: IInterception =
      interception ?? catchObjectApproach(context, frame, arm);
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
        axis: "partner",
        value: context.params.partner,
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
        axis: "partner",
        value: context.params.partner,
        reason: `the catch starts ${(-contact + 0.1).toFixed(2)} s too late to prepare`,
        fix: "start the catch at least 0.1 s before the object arrives: with the throw, or cut from the thrower's own throw at its release",
      });
    const secured: number = contact + GIVE_TIME;
    const held: number = secured + 0.4;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(held + 0.6, [
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
    const sternumAt: ReturnType<typeof HumanTrunk.prepareRegion> =
      HumanTrunk.prepareRegion(body, "sternum");
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
        : [context.params.hand ?? "right"];
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
        // The elbow hangs below the catching hand, a named place, so a read
        // of the moving target never sweeps the elbow afresh.
        bend: "hang",
      });
      // The palm target a pocketed catch is corrected through.
      const corrected:
        | ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareTarget>
        | undefined =
        pocket === undefined
          ? undefined
          : AutoMovieMotionHumanArmTarget.prepareTarget(
              body,
              side,
              "palm",
              "relaxed",
            );
      // The hand is taken from where the reach begins: before it a carrier's
      // arm and fingers stay its own.
      return AutoMovieMotionHumanArm.move({
        fixedShape: "relaxed",
        body,
        side,
        from: reach,
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
          if (corrected === undefined) return target;
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
    // The arm before the catch: the carrier's own as the reach begins,
    // its goal for this arm stripped, or the entry's when nothing carries.
    const before: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanEntryState["pose"] = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanEntryState["pose"] => {
      const carried: IAutoMovieMotionHumanPosture | undefined =
        context.carrier?.posture(reach);
      if (carried === undefined) return context.entry.pose;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...carried.limbs };
      delete limbs[side === "left" ? "leftArm" : "rightArm"];
      return resolveHumanPosture(body, { ...carried, limbs });
    };
    // Each catching arm is one admitted course over where its goal is
    // written, from the reach through the contact, the give and the carry,
    // at the law's own pace, never refitted per second.
    const composed: IAutoMovieMotionHumanActionPlan = sides.reduce(
      (
        plan: IAutoMovieMotionHumanActionPlan,
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanActionPlan =>
        courseArmAtPace({ body, entry: { pose: before(side) } }, plan, side, {
          start: reach,
          ready: contact,
          relax: duration,
          end: duration,
        }),
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "contact",
        primitives: sides.map(hand),
      }),
    );
    // The object's centre at a second, read on the composed posture there.
    const path = (seconds: number): IAutoMovieVector3 => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      return object(
        seconds,
        composed.posture(seconds, undefined, resolution),
        resolution,
      );
    };
    return {
      ...composed,
      object: path,
      offers: { family: "catchObject", object: path },
    };
  }
}
