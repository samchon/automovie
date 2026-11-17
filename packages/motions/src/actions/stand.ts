import type { AutoMovieHumanoidBone, AutoMovieMotionHumanActionName, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanEntryState, IAutoMovieMotionHumanFrame, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanStand, IAutoMovieMotionHumanStandUpright, IAutoMovieMotionHumanSupportCarry, IAutoMovieRandom, IAutoMovieVector3 } from "@automovie/interface";

import { minimumJerk, seededSmoothNoise } from "@automovie/engine";
import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanBound } from "../law/HumanBound";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { HumanSkill } from "../skill/HumanSkill";
import { standFeet } from "./standFeet";
import { standRelaxed } from "./standRelaxed";
import { standUpright } from "./standUpright";

/**
 * Quiet standing: both feet planted where they are (or under the hips when
 * entered from the air), the pelvis settling over them, the column upright on
 * the plumb line and inclined slightly forward at the ankles
 * ({@link standUpright}), arms hanging relaxed, and the body swaying slightly.
 *
 * The feet keep their entry plants so a stop never slides them; a foot that
 * was not planted lands at its rest place beside the other. The root moves
 * from its entry position to the midpoint of the feet over the first 0.5 s on
 * a minimum-jerk profile and sits 5 mm below full extension so the knees are
 * not locked. Each foot turns out 7° from the heading, the mean adult foot
 * progression angle (Perry and Burnfield, Gait Analysis, 2nd ed.). Arms hang
 * relaxed (`relaxed`): 12° of elbow flexion, the hand in its position of rest
 * (`HumanHand.shape`, relaxed), and the least shoulder abduction that hangs
 * the hand beside the thigh, its digits clear of the body. Postural sway moves the root on two
 * seeded smooth signals below 1 Hz, side to side and front to back in the
 * body's frame, with an RMS of 3 mm for an elite and 4.8
 * mm for a novice: quiet-stance centre-of-pressure sway of healthy adults is a
 * few millimetres RMS (Prieto et al. 1996), and experts sway less (Perrin et
 * al. 2002, provisional factor 1.6); a given `sway` replaces that RMS, and 0
 * stands still. The window of the noise keeps the start and the end of the
 * stand exact. A law acting with one side that stands on this law's body
 * passes that side (`plan`'s `side`): the side-to-side draw is signed in
 * that side's frame, so a left action's sway is the mirror of a right one's
 * for every seed, its statistics unchanged.
 */
export namespace stand {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "stand";

  /** Cancel table: a stand can be cut anywhere. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** What quiet standing lets an overlay take: the arms, the hands, the head and the trunk's turn. */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = [
    "head",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
    "trunkTurn",
  ];

  /**
   * Plan a stand.
   *
   * @param context The action's context.
   * @param side The side of the law that stands on this body, whose frame the side-to-side sway is signed in: a left side's sway mirrors a right side's. The right when absent, as for a stand acting with no side.
   * @returns The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    side: IAutoMovieMotionHumanHand.Side = "right",
  ): IAutoMovieMotionHumanActionPlan {
    const duration: number = context.params.seconds ?? 1.5;
    HumanBound.above("seconds", duration, 0, "s");
    const yaw: number = context.entry.posture.yaw;
    const course: standFeet.ICourse = standFeet.of(
      context.body,
      context.entry,
      yaw,
    );
    const footing: Record<"left" | "right", IAutoMovieVector3> = course.flat;
    const initial: IAutoMovieVector3 = course.offset(0);
    const upright: IAutoMovieMotionHumanStandUpright.IAlignment = standUpright.of(context.body);
    const middle: IAutoMovieVector3 = root(context.body, footing, yaw);
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...relaxed(context.body),
      ...upright.joints,
    };
    const settle: number = Math.min(0.5, duration);
    const from: IAutoMovieVector3 = context.entry.posture.root;
    const sway: number =
      context.params.sway ?? 0.003 * HumanSkill.sway(context.skill);
    HumanBound.least("sway", sway, 0, "m");
    const sx: IAutoMovieRandom = context.random("swayX");
    const sz: IAutoMovieRandom = context.random("swayZ");

    // The support the stance stands on: the ground, or a prop that moves.
    const left: IAutoMovieMotionHumanContactWindow.Support = HumanSupportFrame.contact(
      context,
      "leftFoot",
    );
    const right: IAutoMovieMotionHumanContactWindow.Support = HumanSupportFrame.contact(
      context,
      "rightFoot",
    );
    const inherited: string | undefined =
      context.entry.feet.left.planted &&
      context.entry.feet.right.planted &&
      left.kind === "prop" &&
      right.kind === "prop" &&
      left.subject === right.subject
        ? left.subject
        : undefined;
    const on: IAutoMovieMotionHumanStand.IParams["on"] =
      context.params.on ??
      (inherited === undefined ? undefined : { prop: inherited });
    const carried: (seconds: number) => IAutoMovieMotionHumanSupportCarry.ICarry = (
      seconds: number,
    ): IAutoMovieMotionHumanSupportCarry.ICarry =>
      on === undefined
        ? {
            point: (p: IAutoMovieVector3): IAutoMovieVector3 => p,
            turn: { x: 0, y: 0, z: 0, w: 1 },
            yaw: 0,
          }
        : HumanSupportCarry.of(
            (t: number): IAutoMovieMotionHumanProp.IFrame => context.prop(on.prop).frame(t),
            context.start,
            context.start + seconds,
          );
    return {
      duration,
      events: [{ name: "settled", share: settle / duration }],
      contacts: (["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IAutoMovieMotionHumanContactWindow => ({
          part,
          kind: "plant" as const,
          from: 0,
          to: 1,
          support:
            on === undefined
              ? HumanSupportFrame.contact(context, part)
              : { kind: "prop" as const, subject: on.prop },
        }),
      ),
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = minimumJerk(t / settle).s;
        const u: number = t / duration;
        const offset: IAutoMovieVector3 = course.offset(s);
        // The sway runs side to side and front to back in the body's frame,
        // the side to side signed in the acting side's frame.
        const swayed: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          {
            x:
              (side === "left" ? -1 : 1) *
              sway *
              Math.SQRT2 *
              seededSmoothNoise(sx, u, duration, 0.8),
            y: 0,
            z: sway * Math.SQRT2 * seededSmoothNoise(sz, u, duration, 0.8),
          },
        );
        const root: IAutoMovieVector3 = {
          x:
            from.x +
            (middle.x - from.x) * s +
            offset.x -
            initial.x * (1 - s) +
            swayed.x,
          y: from.y + (middle.y - from.y) * s + offset.y - initial.y * (1 - s),
          z:
            from.z +
            (middle.z - from.z) * s +
            offset.z -
            initial.z * (1 - s) +
            swayed.z,
        };
        // On a moving support the stance planned at the entry is carried by
        // the support's rigid motion since then (#3491); its tilt is not
        // read yet, only its travel and its turn about the vertical.
        const carry: IAutoMovieMotionHumanSupportCarry.ICarry = carried(t);
        const placed: IAutoMovieVector3 = carry.point(root);
        return course.write(
          {
            root: placed,
            yaw: yaw + carry.yaw,
            pitch: 0,
            roll: 0,
            joints,
            limbs: {},
          },
          s,
          carry,
        );
      },
    };
  }

  /** Foot progression angle, degrees outward from the heading (Perry and Burnfield). */
  export const TOE_OUT: number = 7;

  /**
   * A body's relaxed hanging arms, clinical degrees: 12 degrees of elbow
   * flexion, each hand in its position of rest (`HumanHand.shape`, relaxed),
   * and the least shoulder abduction at which those relaxed hands lie beside
   * the thighs, every digit clear of the rest of the body
   * (`HumanDigitFit.depth` no more than zero) in the quiet stance. The
   * abduction is found once per body by bisection between none and the
   * shoulder's range, the depth falling as the arm swings out, until the
   * bracket is no wider than the resolution to which a solver resolves a
   * joint's angle (`ROM_TOLERANCE`, the engine's range owner, as the limb
   * fits resolve theirs), and kept: a wider build hangs its arms wider.
   *
   * @param body The body.
   * @returns Angles for both arms and hands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the hanging posture, clearance, body dependence and resolution.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the body-dependent hanging-arm search to standRelaxed, preserving the standing law's public entry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No independent relaxed angle is kept here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm is chosen by this entry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses standRelaxed's weak per-body cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This entry owns no retained state.
   */
  export function relaxed(
    body: IAutoMovieMotionHumanBody,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    return standRelaxed(body);
  }

  /**
   * The shoulder abduction a body's relaxed arms hang at, degrees
   * (`relaxed`): the one a swinging or raised arm keeps across the body.
   *
   * @param body The body.
   * @returns Degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the angle, its unit and its use by moving arms.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the shoulder abduction from this body's relaxed arm, the same collision-free hanging posture the stand law uses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No second standing angle is chosen.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm is chosen.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the relaxed posture's per-body weak cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself.
   */
  export function abduction(body: IAutoMovieMotionHumanBody): number {
    return relaxed(body).leftUpperArm![1];
  }

  /**
   * Relaxed hanging arms with no body, clinical degrees: 5 degrees of
   * shoulder abduction, 12 of elbow flexion and the hands at rest. Kept only
   * for the laws whose key tables do not yet take the body; each is moving to
   * `relaxed`, which hangs the arm clear of the body it belongs to, and this
   * goes with the last of them.
   */
  export const RELAXED: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = (() => {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const side of ["left", "right"] as const) {
      Object.assign(out, HumanHand.shape(side, "relaxed"));
      out[`${side}UpperArm`] = [0, 5, 0];
      out[`${side}LowerArm`] = [12, 0, 0];
    }
    return out;
  })();

  /**
   * Quiet ankle targets: a planted foot flattened about its displayed
   * bearing socket; another foot at rest on the same measured floor.
   * The world contact stays fixed while the ankle follows its rocker.
   *
   * @param body The body.
   * @param entry The entry state.
   * @param yaw The heading, degrees.
   * @returns Ankle points, world metres.
   */
  export function feet(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    yaw: number,
  ): Record<"left" | "right", IAutoMovieVector3> {
    return standFeet.of(body, entry, yaw).flat;
  }

  /**
   * The root of a quiet stance over two ankle points: the pelvis over the
   * feet's midpoint as it stands over its rest feet, shifted forward by the
   * upright alignment's lean (`standUpright`), and `DROP` below its rest
   * height above the mean ankle plane so the planted legs are not at full extension. The single owner of
   * standing root placement: any law that ends or rests standing on its feet
   * places its root here.
   *
   * @param body The body.
   * @param feet Ankle points, world metres.
   * @param yaw The heading, degrees.
   * @returns The root, world metres.
   */
  export function root(
    body: IAutoMovieMotionHumanBody,
    feet: Readonly<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
  ): IAutoMovieVector3 {
    const mid: IAutoMovieVector3 = centre(body, yaw);
    const lean: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: standUpright.of(body).lean },
    );
    return {
      x: (feet.left.x + feet.right.x) / 2 - mid.x + lean.x,
      y: (feet.left.y + feet.right.y) / 2 - body.measure.ankleHeight - DROP,
      z: (feet.left.z + feet.right.z) / 2 - mid.z + lean.z,
    };
  }

  /** How far a quiet stance's root sits below its rest height, metres, keeping the planted knees off full extension. */
  export const DROP: number = 0.005;

  /**
   * Planted leg goals on given ankle points, knees bending forward.
   *
   * @param body The body.
   * @param root The root, world metres.
   * @param yaw The heading, degrees.
   * @param feet Ankle points, world metres.
   * @returns The leg goals.
   */
  export function legs(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    feet: Record<"left" | "right", IAutoMovieVector3>,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const frame: IAutoMovieMotionHumanFrame.IFrame = { origin: root, yaw };
    // The knee points over the foot (Perry and Burnfield): the foot has no
    // axial joint, so its toe-out comes from the hip's twist that this hint sets.
    const knee = (side: "left" | "right"): IAutoMovieVector3 =>
      HumanFrame.point(
        {
          origin: HumanFrame.point(frame, body.rest.get(`${side}LowerLeg`)!),
          yaw: yaw + (side === "left" ? TOE_OUT : -TOE_OUT),
        },
        { x: 0, y: 0, z: 1 },
      );
    // Each foot turns about its toes' joint when the ankle cannot hold it flat (HumanFoot.heelOff).
    return {
      leftLeg: {
        point: feet.left,
        bend: knee("left"),
        rotation: HumanFrame.turn(yaw + TOE_OUT),
        planted: true,
        contact: HumanFoot.offset(body, "left", "mtp"),
      },
      rightLeg: {
        point: feet.right,
        bend: knee("right"),
        rotation: HumanFrame.turn(yaw - TOE_OUT),
        planted: true,
        contact: HumanFoot.offset(body, "right", "mtp"),
      },
    };
  }

  /**
   * The standing posture of a body at a floor point and heading, the state
   * every performer starts from.
   *
   * @param body The body.
   * @param at The floor point under the body, world metres.
   * @param yaw The heading, degrees.
   * @returns The posture.
   */
  export function posture(
    body: IAutoMovieMotionHumanBody,
    at: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanPosture {
    return stance(body, at, yaw, relaxed(body));
  }

  /**
   * The standing posture of a body with given arms, as `posture` stands it.
   *
   * @param body The body.
   * @param at The floor point under the body, world metres.
   * @param yaw The heading, degrees.
   * @param arms The arms' and hands' angles, clinical degrees.
   * @returns The posture.
   */
  export function stance(
    body: IAutoMovieMotionHumanBody,
    at: IAutoMovieVector3,
    yaw: number,
    arms: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >,
  ): IAutoMovieMotionHumanPosture {
    const frame: IAutoMovieMotionHumanFrame.IFrame = { origin: at, yaw };
    const feet = {} as Record<"left" | "right", IAutoMovieVector3>;
    for (const side of ["left", "right"] as const) {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      feet[side] = HumanFrame.point(frame, {
        x: rest.x,
        y: body.measure.ankleHeight,
        z: rest.z,
      });
    }
    const placed: IAutoMovieVector3 = root(body, feet, yaw);
    return {
      root: placed,
      yaw,
      pitch: 0,
      roll: 0,
      joints: { ...arms, ...standUpright.of(body).joints },
      limbs: legs(body, placed, yaw, feet),
    };
  }
}

/** The rest feet's midpoint in world offset for a heading, so a stand centres the pelvis over its feet. */
function centre(body: IAutoMovieMotionHumanBody, yaw: number): IAutoMovieVector3 {
  const l: IAutoMovieVector3 = body.rest.get("leftFoot")!;
  const r: IAutoMovieVector3 = body.rest.get("rightFoot")!;
  return HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw },
    { x: (l.x + r.x) / 2, y: 0, z: (l.z + r.z) / 2 },
  );
}
