import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrossing,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStepVault,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { support } from "../../actions/internal/support";
import { supportCourse } from "../../actions/internal/supportCourse";
import { HumanPreparedPlayback } from "../../perform/HumanPreparedPlayback";
import { PreparedHumanIntervals } from "../../perform/PreparedHumanIntervals";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { crossingClearance } from "./crossingClearance";
import { crossingSurface } from "./crossingSurface";
import { prepareVaultArmFrames } from "./prepareVaultArmFrames";
import { stepVaultSupport } from "./stepVaultSupport";

/**
 * Where the palm bears along the top's depth, from its near edge (provisional:
 * behind the knee's path, ahead of the stepping foot).
 */
const PALM_DEPTH: number = 0.37;

/** Where the opposite foot bears along the top's depth (provisional). */
const FOOT_DEPTH: number = 0.73;

/**
 * The swing waypoints' height above the top, foot lengths (provisional: a toe
 * clearance of about 0.15 m for an average foot).
 */
const SWING_RISE: number = 0.59;

/**
 * The swing waypoints' distance outside the near and far edges, foot lengths
 * (provisional).
 */
const SWING_BUFFER: number = 0.58;

/**
 * Seconds over which the vault's arm adjustments fade in at the start and out
 * at the end (provisional).
 */
const EASE: number = 0.4;

/**
 * Height of the palm's arc over the top on its way to and from it, forearm
 * lengths (provisional).
 */
const ARC: number = 0.78;

/**
 * Seconds of the lift that takes the palm clear of the top at its release
 * (provisional).
 */
const PALM_PEEL: number = 0.05;
/**
 * Cross a raised fixed top with one palm and the opposite foot bearing on it:
 * the step vault (`stepVaultSupport`) staged on the named surface. The stepping
 * foot passes waypoints above the near and far edges, the top holds the
 * stepping foot level, a posture layer eases the palm onto its point, holds it
 * flat through its window, peels it off after and lifts the free hand clear of
 * the top, and the clearance of the whole displayed body against the prop's
 * shapes is checked (`crossingClearance`).
 *
 * @param context The action's context.
 * @param frame The crossing frame at the entry.
 * @param ref The top surface.
 * @param hand The bearing hand.
 * @returns The vault, exiting standing beyond the far edge.
 * @throws {HumanRefusal} If the top is out of the hand-and-foot range, a key
 *   misses its contact or the body enters the prop.
 */
export function planNamedVault(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrossing.IParams>,
  frame: HumanFrame.IPrepared,
  ref: IAutoMovieMotionHumanCrossing.ISurface,
  hand: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  const deck: crossingSurface.IExtent = crossingSurface.read(
    context,
    frame,
    ref,
  );
  const body: IAutoMovieMotionHumanBody = context.body;
  const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;

  // The top must start ahead, within a leg length, and stay below the hip by
  // half its height, the range a step vault's stepping foot reaches.
  planNamedVault.admitTop(deck, measure.hipHeight, ref.point);
  const yaw: number = context.entry.posture.yaw;
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const exit: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    frame.point({ x: 0, y: 0, z: deck.far + 1.2 * measure.footLength }),
    yaw,
  );
  const exitToe = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
    const leg: IAutoMovieHumanLimbGoal =
      exit.limbs[side === "left" ? "leftLeg" : "rightLeg"]!;
    return HumanFoot.point(body, side, "mtp", {
      ankle: leg.point,
      rotation: leg.rotation!,
    });
  };
  const fixed = (
    at: IAutoMovieVector3,
  ): IAutoMovieMotionHumanStepVault.Target => ({
    kind: "point",
    at,
    frame: "world",
    normal: { x: 0, y: 1, z: 0 },
  });

  // Palm and foot share the top's width about its middle, no wider than
  // the chest, the hand on its own side.
  const half: number = Math.min(
    0.35 * (deck.right - deck.left),
    0.42 * measure.chestBreadth,
  );
  const sign: number = hand === "left" ? 1 : -1;
  const middle: number = (deck.left + deck.right) / 2;
  const palm: IAutoMovieVector3 = frame.point({
    x: middle + sign * half,
    y: deck.height,
    z: deck.near + PALM_DEPTH * (deck.far - deck.near),
  });
  const opposite: AutoMovieHumanSide = hand === "left" ? "right" : "left";
  const step: IAutoMovieVector3 = frame.point({
    x: middle - sign * half,
    y: deck.height + exitToe(opposite).y,
    z: deck.near + FOOT_DEPTH * (deck.far - deck.near),
  });
  const palmId: string = ref.point + ":palm";
  const footId: string = ref.point + ":foot";
  const onTop = (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
    contact.target !== undefined &&
    contact.target !== "on" &&
    contact.target.kind === "prop" &&
    contact.target.subject === ref.prop;
  const read = (
    target: IAutoMovieMotionHumanSupport.IContact["target"],
  ): IAutoMovieVector3 | undefined =>
    target === undefined || target === "on"
      ? undefined
      : target.kind === "point"
        ? target.at
        : target.kind === "prop"
          ? step
          : undefined;
  const course: supportCourse.ICourse = {
    // A stepping foot rises over the near edge and comes down beyond the
    // far edge, its toe joint above the top by SWING_RISE.
    via: (
      previous: IAutoMovieMotionHumanSupport.IContact,
      next: IAutoMovieMotionHumanSupport.IContact,
    ): readonly IAutoMovieVector3[] | undefined => {
      if (!next.part.endsWith("Foot")) return undefined;
      const p0: IAutoMovieVector3 | undefined = read(previous.target);
      const p1: IAutoMovieVector3 | undefined = read(next.target);
      if (p0 === undefined || p1 === undefined) return undefined;
      const from: IAutoMovieVector3 = frame.local(p0);
      const to: IAutoMovieVector3 = frame.local(p1);
      const lift: number = deck.height + SWING_RISE * measure.footLength;
      const buffer: number = SWING_BUFFER * measure.footLength;
      return [
        frame.point({
          x: from.x,
          y: lift,
          z: Math.max(from.z, deck.near - buffer),
        }),
        frame.point({ x: to.x, y: lift, z: Math.min(to.z, deck.far + buffer) }),
      ];
    },
    level: onTop,
  };
  const supported: IAutoMovieMotionHumanActionPlan = support.plan(
    {
      ...context,
      params: stepVaultSupport({
        hand,
        entry: {
          left: fixed(bones.get("leftToes")!.worldPosition),
          right: fixed(bones.get("rightToes")!.worldPosition),
        },
        palm: { kind: "prop", subject: ref.prop, point: palmId },
        step: { kind: "prop", subject: ref.prop, point: footId },
        exit: { left: fixed(exitToe("left")), right: fixed(exitToe("right")) },
      }),
      aim: (target: IAutoMovieMotionTarget, seconds: number) =>
        target.kind === "prop" && target.subject === ref.prop
          ? {
              point: target.point === palmId ? palm : step,
              normal: { x: 0, y: 1, z: 0 },
            }
          : context.aim(target, seconds),
    },
    course,
  );
  // The palm already touches the top as it settles before its support
  // window and still touches it while it peels off after, so its published
  // contact spans both.
  const peel: number = PALM_PEEL / supported.duration;
  const layer = (): IAutoMovieMotionHumanActionPlan["posture"] =>
    prepareVaultLayer(body, frame, yaw, deck, supported, hand, palm, ref.prop);
  let posed: IAutoMovieMotionHumanActionPlan["posture"] = layer();
  const plan: IAutoMovieMotionHumanActionPlan = {
    ...supported,
    contacts: supported.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow =>
        window.part === `${hand}Hand` &&
        window.support.kind === "prop" &&
        window.support.subject === ref.prop
          ? {
              ...window,
              from: Math.max(0, window.from - peel),
              to: Math.min(1, window.to + peel),
            }
          : window,
    ),
    prepare: (): void => {
      supported.prepare?.();
      posed = layer();
    },
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => posed(...args),
    base: { kind: "standing" },
  };
  crossingClearance(context, plan, [ref.prop]);
  return HumanPreparedPlayback.rebindPosture(plan, supported, body);
}

/** Admission of the named step vault before any pose fitting. */
export namespace planNamedVault {
  /** The top's near edge and height above the entering floor. */
  export type ITop = Pick<crossingSurface.IExtent, "near" | "height">;

  /** Require a top ahead within a leg length and below half the hip height. */
  export function admitTop(deck: ITop, hip: number, id: string): void {
    if (
      deck.near <= 0 ||
      deck.near > hip ||
      deck.height <= 0 ||
      deck.height > 0.5 * hip
    )
      throw crossingSurface.refusal(
        "over.point",
        id,
        "the raised support is outside the hand-and-foot crossing range",
      );
  }
}

/**
 * The posture layer over the support plan: the bearing palm eased onto its
 * point from the displayed wrist before its window, held flat there through it
 * and peeled off after it, and the free hand lifted clear of the top. Every
 * goal starts from the displayed wrist, so it joins the support plan's arm
 * without a step when its weight reaches zero.
 */
function prepareVaultLayer(
  body: IAutoMovieMotionHumanBody,
  frame: HumanFrame.IPrepared,
  yaw: number,
  deck: crossingSurface.IExtent,
  supported: IAutoMovieMotionHumanActionPlan,
  hand: AutoMovieHumanSide,
  palm: IAutoMovieVector3,
  subject: string,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const palmPoint: IAutoMovieVector3 = HumanHand.offset(
    body,
    hand,
    "palm",
    "flat",
  ).point;
  const flat: ReturnType<typeof HumanHand.shape> = HumanHand.shape(
    hand,
    "flat",
  );
  const duration: number = supported.duration;
  const palmWindows: IAutoMovieMotionHumanContactWindow[] =
    supported.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === `${hand}Hand` &&
        window.support.kind === "prop" &&
        window.support.subject === subject,
    );
  const landing: number =
    palmWindows.length === 0 ? 0 : palmWindows[0]!.from * duration;
  const landed: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture.seeded(body, supported.posture(landing)).pose,
  );
  const toward: IAutoMovieVector3 = Vector3.subtract(
    palm,
    landed.get(`${hand}UpperArm`)!.worldPosition,
  );
  const level: IAutoMovieVector3 = { x: toward.x, y: 0, z: toward.z };
  const fingers: IAutoMovieVector3 =
    Vector3.length(level) < 0.012
      ? HumanFrame.forward(yaw)
      : Vector3.normalize(level);
  const spans: Array<{ from: number; to: number }> = palmWindows
    .map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): { from: number; to: number } => ({
        from: window.from * duration,
        to: window.to * duration,
      }),
    )
    .sort((a, b): number => a.from - b.from);
  const merged: typeof spans = [];
  for (const span of spans) {
    const previous: (typeof spans)[number] | undefined = merged.at(-1);
    if (previous === undefined || previous.to < span.from) merged.push(span);
    else previous.to = Math.max(previous.to, span.to);
  }
  const palmEnd = (index: number): number => merged[index]!.to;
  const leave: number = merged.at(-1)?.to ?? duration;
  const arms: ReturnType<typeof prepareVaultArmFrames> = prepareVaultArmFrames(
    body,
    supported,
  );
  const goal: IAutoMovieMotionHumanHand.IWrist = HumanHand.reach(
    body,
    hand,
    "palm",
    { point: palm, normal: { x: 0, y: -1, z: 0 }, forward: fingers },
    "flat",
  );
  return (seconds, channels, resolution, projection, evaluation) => {
    const posture: IAutoMovieMotionHumanPosture = supported.posture(
      seconds,
      channels,
      resolution,
      projection,
      evaluation,
    );
    const ease: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.max(0, Math.min(1, seconds / EASE, (duration - seconds) / EASE)),
    );
    if (
      ease === 0 ||
      (channels !== undefined &&
        !channels.includes("leftArm") &&
        !channels.includes("rightArm") &&
        !channels.includes(`${hand}Hand`))
    )
      return posture;
    const current: ReturnType<ReturnType<typeof prepareVaultArmFrames>> =
      arms(seconds);
    const index: number = PreparedHumanIntervals.lowerBound(
      merged.length,
      palmEnd,
      seconds,
    );
    const handGap: number = Math.min(
      Math.max(0, (merged[index]?.from ?? Infinity) - seconds),
      seconds - (merged[index - 1]?.to ?? -Infinity),
    );
    // The palm approaches its point from the vault's start and leaves it
    // until the vault's end: its share of the way is 1 through its window.
    const approach: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      palmWindows.length === 0
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              seconds < landing
                ? seconds / landing
                : (duration - seconds) / Math.max(1e-9, duration - leave),
            ),
          ),
    );
    const palmWeight: number = ease * approach;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const arm: AutoMovieHumanLimb = `${side}Arm`;
      if (channels !== undefined && !channels.includes(arm)) continue;
      const { elbow, wrist, rotation }: prepareVaultArmFrames.IFrame =
        current(side);
      if (side === hand && palmWeight > 0) {
        // The fingers keep one direction for the whole vault, the shoulder's
        // reach to the palm as the palm lands: a direction taken from the
        // moving forearm reverses as the shoulder passes over the palm and
        // would turn the hand half round.
        const point: IAutoMovieVector3 = Vector3.lerp(
          wrist,
          goal.point,
          palmWeight,
        );
        const lift: number =
          0.16 *
          measure.forearm *
          palmWeight *
          AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, handGap / PALM_PEEL));
        // On its way to and from the top the palm arcs over the edge: the arc
        // is zero at the displayed wrist and at contact, so it joins both.
        const arc: number =
          ease *
          Math.sin(Math.PI * approach) *
          Math.max(0, deck.height + ARC * measure.forearm - point.y);
        limbs[arm] = {
          point: { ...point, y: point.y + lift + arc },
          rotation: Quaternion.slerp(rotation, goal.rotation, palmWeight),
          bend: elbow,
          ...(handGap === 0 ? { contact: palmPoint, planted: true } : {}),
        };
        continue;
      }

      // A free hand over the top is lifted clear of it.
      const at: IAutoMovieVector3 = frame.local(wrist);
      const gap: number = Math.max(deck.near - at.z, at.z - deck.far, 0);
      const weight: number =
        ease *
        AutoMovieEngineMotionSampling.minimumJerkShare(Math.max(0, 1 - gap / (0.7 * measure.forearm)));
      const raise: number =
        Math.max(0, deck.height + 0.65 * measure.forearm - at.y) * weight;
      if (raise > 0)
        limbs[arm] = {
          point: { ...wrist, y: wrist.y + raise },
          bend: elbow,
          rotation,
        };
    }
    return {
      ...posture,
      limbs,
      joints:
        palmWeight === 0 ||
        (channels !== undefined && !channels.includes(`${hand}Hand`))
          ? posture.joints
          : { ...posture.joints, ...blendJoints(posture, flat, palmWeight) },
    };
  };
}

/** Blend the hand's joints toward a shape by a weight. */
function blendJoints(
  posture: IAutoMovieMotionHumanPosture,
  shape: ReturnType<typeof HumanHand.shape>,
  weight: number,
): IAutoMovieMotionHumanPosture["joints"] {
  const joints: Record<string, readonly [number, number, number]> = {};
  const target: Readonly<
    Record<string, IAutoMovieMotionHumanPosture["joints"]["hips"]>
  > = shape;
  const entered: typeof target = posture.joints;
  for (const [bone, angles] of Object.entries(target)) {
    if (angles === undefined) continue;
    const from: readonly [number, number, number] = entered[bone] ?? [0, 0, 0];
    joints[bone] = [
      from[0] + (angles[0] - from[0]) * weight,
      from[1] + (angles[1] - from[1]) * weight,
      from[2] + (angles[2] - from[2]) * weight,
    ];
  }
  return joints;
}
