import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
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
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { support } from "../actions/support";
import { supportCourse } from "../actions/supportCourse";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crossingClearance } from "./crossingClearance";
import { crossingSurface } from "./crossingSurface";
import { stepVaultSupport } from "./stepVaultSupport";

/** Where the palm bears along the top's depth, from its near edge (provisional: behind the knee's path, ahead of the stepping foot). */
const PALM_DEPTH: number = 0.37;

/** Where the opposite foot bears along the top's depth (provisional). */
const FOOT_DEPTH: number = 0.73;

/** The swing waypoints' height above the top, foot lengths (provisional: a toe clearance of about 0.15 m for an average foot). */
const SWING_RISE: number = 0.59;

/** The swing waypoints' distance outside the near and far edges, foot lengths (provisional). */
const SWING_BUFFER: number = 0.58;

/** Seconds over which the vault's arm and knee adjustments fade in at the start and out at the end (provisional). */
const EASE: number = 0.4;

/** Seconds before and after the palm window over which the palm eases onto and off the top (provisional). */
const PALM_REACH: number = 0.24;

/** Seconds of the lift that takes the palm clear of the top at its release (provisional). */
const PALM_PEEL: number = 0.05;

/**
 * Cross a raised fixed top with one palm and the opposite foot bearing on
 * it: the step vault (`stepVaultSupport`) staged on the named surface. The
 * stepping foot passes waypoints above the near and far edges, the top
 * holds the stepping foot level, and the clearance of the whole displayed
 * body against the prop's shapes is checked (`crossingClearance`).
 *
 * @param context The action's context.
 * @param frame The crossing frame at the entry.
 * @param ref The top surface.
 * @param hand The bearing hand.
 * @returns The vault, exiting standing beyond the far edge.
 * @throws {HumanRefusal} If the top is out of the hand-and-foot range, a key misses its contact or the body enters the prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the support order, swing course, frame and refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The cited step vault's support order is fitted by the shared support law on points of the named top; a posture layer keeps the palm flat on its point through its window and the free arm and stepping knee clear of the top.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, support targets, the support plan, then one posture layer and the clearance check.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every contact point is on the named top or the floor; a body that enters the prop is refused, not moved.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four stances fitted once; each sample resolves the support posture once more to read its arms and knee.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The palm and foot targets and their windows are prepared once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan retains only its prepared targets for its lifetime.
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

  // The top must start ahead, within a stride, and stay below the hip by
  // half its height, the range a step vault's stepping foot reaches.
  if (
    deck.near <= 0 ||
    deck.near > measure.hipHeight ||
    deck.height <= 0 ||
    deck.height > 0.5 * measure.hipHeight
  )
    throw crossingSurface.refusal(
      "over.point",
      ref.point,
      "the raised support is outside the hand-and-foot crossing range",
    );
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
  const plan: IAutoMovieMotionHumanActionPlan = {
    ...supported,
    posture: prepareVaultLayer(
      body,
      frame,
      yaw,
      deck,
      supported,
      hand,
      palm,
      ref.prop,
    ),
  };
  crossingClearance(context, plan, [ref.prop]);
  return { ...plan, base: { kind: "standing" } };
}

/**
 * The posture layer over the support plan: the bearing palm laid flat on
 * its point through its window and eased on and off around it, the free
 * hand lifted clear of the top, and the stepping knee drawn aside and back
 * from the near face before that foot steps up.
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
  const sign: number = hand === "left" ? 1 : -1;
  const opposite: AutoMovieHumanSide = hand === "left" ? "right" : "left";
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
  const raised: IAutoMovieMotionHumanContactWindow | undefined =
    supported.contacts.find(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === `${opposite}Foot` &&
        window.support.kind === "prop" &&
        window.support.subject === subject,
    );
  return (seconds, channels, resolution, projection) => {
    const posture: IAutoMovieMotionHumanPosture = supported.posture(
      seconds,
      channels,
      resolution,
      projection,
    );
    const ease: number = minimumJerk.share(
      Math.max(0, Math.min(1, seconds / EASE, (duration - seconds) / EASE)),
    );
    if (ease === 0) return posture;
    const current: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, posture).pose,
    );
    const handGap: number = Math.min(
      Infinity,
      ...palmWindows.map((window: IAutoMovieMotionHumanContactWindow): number =>
        Math.max(
          window.from * duration - seconds,
          seconds - window.to * duration,
          0,
        ),
      ),
    );
    const palmWeight: number = minimumJerk.share(
      Math.max(0, 1 - handGap / PALM_REACH),
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };

    // Before the stepping foot leaves for the top, its knee would swing
    // into the near face: draw the knee pole aside and back as the knee
    // nears that face.
    if (raised !== undefined && seconds < raised.from * duration) {
      const foot: IAutoMovieResolvedBone = current.get(`${opposite}Foot`)!;
      const knee: IAutoMovieVector3 = current.get(
        `${opposite}LowerLeg`,
      )!.worldPosition;
      const at: IAutoMovieVector3 = frame.local(knee);
      const margin: number = 0.23 * measure.shank;
      const crowd: number = minimumJerk.share(
        Math.min(1, Math.max(0, (at.z - (deck.near - margin)) / margin)),
      );
      const weight: number = ease * crowd;
      if (weight > 0) {
        const leg: AutoMovieHumanLimb = `${opposite}Leg`;
        const share: number = seconds / duration;
        const bearing: boolean = supported.contacts.some(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            window.part === `${opposite}Foot` &&
            window.from <= share &&
            window.to >= share,
        );
        const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          opposite,
          { ankle: foot.worldPosition, rotation: foot.worldRotation },
          bearing,
        );
        limbs[leg] = {
          ...(posture.limbs[leg] ?? goal),
          bend: frame.point({
            ...at,
            x: at.x - sign * weight * measure.thigh,
            z: at.z - 0.6 * weight * measure.thigh,
          }),
        };
      }
    }
    for (const side of ["left", "right"] as const) {
      const arm: AutoMovieHumanLimb = `${side}Arm`;
      const elbow: IAutoMovieVector3 = current.get(
        `${side}LowerArm`,
      )!.worldPosition;
      const wrist: IAutoMovieResolvedBone = current.get(`${side}Hand`)!;
      if (side === hand && palmWeight > 0) {
        // The palm stays at the same point while its fingers follow the
        // horizontal forearm. Fixing them toward travel would demand a
        // reversed wrist when the shoulder is already across the box.
        const reach: IAutoMovieVector3 = Vector3.subtract(palm, elbow);
        let forward: IAutoMovieVector3 = { x: reach.x, y: 0, z: reach.z };
        if (Vector3.length(forward) < 0.012)
          forward = HumanFrame.forward(yaw + 90);
        const goal: IAutoMovieMotionHumanHand.IWrist = HumanHand.reach(
          body,
          hand,
          "palm",
          { point: palm, normal: { x: 0, y: -1, z: 0 }, forward },
          "flat",
        );
        const clear: IAutoMovieVector3 = {
          ...wrist.worldPosition,
          y: Math.max(
            wrist.worldPosition.y,
            deck.height + 0.78 * measure.forearm,
          ),
        };
        const point: IAutoMovieVector3 = Vector3.lerp(
          clear,
          goal.point,
          palmWeight,
        );
        const lift: number =
          0.16 *
          measure.forearm *
          palmWeight *
          minimumJerk.share(Math.min(1, handGap / PALM_PEEL));
        limbs[arm] = {
          point: { ...point, y: point.y + lift },
          rotation: Quaternion.slerp(
            wrist.worldRotation,
            goal.rotation,
            palmWeight,
          ),
          bend: elbow,
          ...(handGap === 0 ? { contact: palmPoint, planted: true } : {}),
        };
        continue;
      }

      // A free hand over the top is lifted clear of it.
      const at: IAutoMovieVector3 = frame.local(wrist.worldPosition);
      const gap: number = Math.max(deck.near - at.z, at.z - deck.far, 0);
      const weight: number =
        ease *
        minimumJerk.share(Math.max(0, 1 - gap / (0.7 * measure.forearm)));
      const raise: number =
        Math.max(0, deck.height + 0.65 * measure.forearm - at.y) * weight;
      if (raise > 0)
        limbs[arm] = {
          point: { ...wrist.worldPosition, y: wrist.worldPosition.y + raise },
          bend: elbow,
          rotation: wrist.worldRotation,
        };
    }
    return {
      ...posture,
      limbs,
      joints:
        palmWeight === 0
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
  for (const [bone, angles] of Object.entries(shape)) {
    if (angles === undefined) continue;
    const from: readonly [number, number, number] = posture.joints[
      bone as keyof IAutoMovieMotionHumanPosture["joints"]
    ] ?? [0, 0, 0];
    joints[bone] = [
      from[0] + (angles[0] - from[0]) * weight,
      from[1] + (angles[1] - from[1]) * weight,
      from[2] + (angles[2] - from[2]) * weight,
    ];
  }
  return joints;
}
