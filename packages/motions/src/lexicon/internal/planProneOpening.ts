import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { floorEntry } from "../../floor/internal/floorEntry";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/**
 * How far beyond the solid the crawl ends, statures (provisional: the feet
 * clear of the far side).
 */
const BEYOND: number = 0.7;

/** The root's advance per palm stroke, forearm lengths (provisional). */
const STROKE: number = 0.65;

/**
 * Seconds per stroke for a body of hip height STROKE_HIP, scaled by the square
 * root of the hip height (provisional; Froude-similar timing).
 */
const STROKE_SECONDS: number = 0.48;

/**
 * The hip height at which a stroke takes STROKE_SECONDS, metres (provisional:
 * an average adult).
 */
const STROKE_HIP: number = 0.93;

/** The share of each stroke its palm bears, centred on the stroke (provisional). */
const BEAR: number = 0.5;

/**
 * How far into its stroke's advance the palm is placed ahead of the shoulder,
 * strokes (provisional: ahead of the pull's middle).
 */
const REACH: number = 0.72;

/** The palm's lift between strokes, metres (provisional). */
const LIFT: number = 0.035;

/**
 * The least downward component of the trunk's forward axis for a prone entry
 * (provisional: about 45 degrees face down).
 */
const PRONE: number = 0.7;

/** One palm stroke: its hand and wrist goal. */
interface IPalmPlacement {
  /** The bearing hand. */
  side: AutoMovieHumanSide;

  /** Its wrist goal with the palm flat on the floor. */
  wrist: IAutoMovieMotionHumanHand.IWrist;
}
/**
 * Move a prone entry through a low aperture with alternating palm support. The
 * chest stays low on its incoming floor pose. Each palm advances, supports the
 * moving torso while it stays at a world point, then releases to the next
 * stroke. Rise with the existing floor get-up.
 *
 * @param context The actor's displayed entry and canonical body.
 * @param frame The level opening's world passage frame.
 * @param near The near side, opening-local metres.
 * @param far The far side, opening-local metres.
 * @returns A low passage exiting prone and clear of the solid.
 */
export function planProneOpening(
  context: IAutoMovieMotionHumanActionContext<object>,
  frame: HumanFrame.IPrepared,
  near: number,
  far: number,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const entry: IAutoMovieMotionHumanPosture = floorEntry.displayed(context);
  const rootFrame: IAutoMovieMotionHumanActionContext["entry"]["pose"]["root"] =
    context.entry.pose.root;
  if (
    context.entry.base.kind !== "lying" ||
    rootFrame === undefined ||
    rootFrame === null ||
    Quaternion.rotateVector(rootFrame.rotation, { x: 0, y: 0, z: 1 }).y > -PRONE
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: context.entry.base.kind,
      feasible: { kind: "alternatives", values: ["prone"] },
      reason: "the low crawl starts facing the floor",
      fix: "lie down prone on the approach side before entering the aperture",
    });

  const from: IAutoMovieVector3 = frame.local(entry.root);
  const finish: IAutoMovieVector3 = {
    ...from,
    x: 0,
    z: far + body.measure.stature * BEYOND,
  };
  const distance: number = finish.z - from.z;
  if (from.z >= near)
    throw new HumanRefusal({
      kind: "reach",
      axis: "aperture",
      value: from.z,
      reason: "the prone actor is already beyond the near side of the opening",
      fix: "stage the prone entry on the approach side",
    });
  const forward: IAutoMovieVector3 = HumanFrame.forward(
    context.entry.posture.yaw,
  );
  const rest: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );

  // Body-scaled provisional stage timing. Keep one hand in its support
  // window through the centre of each pull, with the other hand free.
  const strokes: number = Math.max(
    2,
    Math.ceil(distance / (STROKE * body.measure.forearm)),
  );
  const duration: number =
    strokes * STROKE_SECONDS * Math.sqrt(body.measure.hipHeight / STROKE_HIP);
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    { part: "back", kind: "lie", support: { kind: "ground" }, from: 0, to: 1 },
  ];
  const events: IAutoMovieMotionEvent[] = [];
  const hands: Record<
    AutoMovieHumanSide,
    ReturnType<typeof HumanHand.shape>
  > = {
    left: HumanHand.shape("left", "flat"),
    right: HumanHand.shape("right", "flat"),
  };
  const palm: Record<AutoMovieHumanSide, IAutoMovieMotionHumanHand.IFrame> = {
    left: HumanHand.offset(body, "left", "palm", "flat"),
    right: HumanHand.offset(body, "right", "palm", "flat"),
  };
  const placements: IPalmPlacement[] = [];
  for (let index: number = 0; index < strokes; index++) {
    const side: AutoMovieHumanSide = index % 2 === 0 ? "left" : "right";
    const contactFrom: number = (index + 0.5 - BEAR / 2) / strokes;
    const contactTo: number = (index + 0.5 + BEAR / 2) / strokes;
    const shoulder: IAutoMovieVector3 = frame.local(
      rest.get(`${side}UpperArm`)!.worldPosition,
    );
    const point: IAutoMovieVector3 = frame.point({
      x: shoulder.x - from.x + from.x * (1 - (index + 0.5) / strokes),
      y: 0,
      z: shoulder.z + (distance * (index + REACH)) / strokes,
    });
    placements.push({
      side,
      wrist: HumanHand.reach(
        body,
        side,
        "palm",
        {
          point,
          normal: { x: 0, y: -1, z: 0 },
          forward,
        },
        "flat",
      ),
    });
    contacts.push({
      part: `${side}Hand`,
      kind: "plant",
      support: { kind: "ground" },
      from: contactFrom,
      to: contactTo,
    });
    events.push(
      { name: `${side}PalmBearing${index + 1}`, share: contactFrom },
      { name: `${side}PalmRelease${index + 1}`, share: contactTo },
    );
  }

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const share: number = Math.min(1, Math.max(0, seconds / duration));
    const scaled: number = share * strokes;
    const index: number = Math.min(strokes - 1, Math.floor(scaled));
    const phase: number = scaled - index;
    const progress: number = (index + minimumJerk.share(phase)) / strokes;
    const root: IAutoMovieVector3 = frame.point(
      Vector3.lerp(from, finish, progress),
    );
    const base: IAutoMovieMotionHumanPosture = { ...entry, root };
    const mount: number = Math.min(
      1,
      (2 * phase) / (1 - BEAR),
      (2 * (1 - phase)) / (1 - BEAR),
    );
    if (!(mount > 0)) return base;

    const { side, wrist } = placements[index]!;
    const forearm: IAutoMovieResolvedBone = rest.get(`${side}LowerArm`)!;
    const hand: IAutoMovieResolvedBone = rest.get(`${side}Hand`)!;
    const offset: IAutoMovieVector3 = Vector3.subtract(root, entry.root);
    const lifted: number = LIFT * Math.sin(Math.PI * mount);
    const weight: number = minimumJerk.share(mount);
    const point: IAutoMovieVector3 = Vector3.lerp(
      Vector3.add(hand.worldPosition, offset),
      wrist.point,
      weight,
    );
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...entry.joints };
    for (const bone of Object.keys(hands[side]) as (keyof typeof joints)[]) {
      const before: readonly [number, number, number] = entry.joints[bone] ?? [
        0, 0, 0,
      ];
      const after: readonly [number, number, number] = hands[side][bone]!;
      joints[bone] = [
        before[0] + (after[0] - before[0]) * weight,
        before[1] + (after[1] - before[1]) * weight,
        before[2] + (after[2] - before[2]) * weight,
      ];
    }
    const goal: IAutoMovieHumanLimbGoal = {
      point: { ...point, y: point.y + lifted },
      rotation: Quaternion.slerp(hand.worldRotation, wrist.rotation, weight),
      bend: Vector3.add(forearm.worldPosition, offset),
      ...(mount === 1 ? { contact: palm[side].point, planted: true } : {}),
    };
    return { ...base, joints, limbs: { [side + "Arm"]: goal } };
  };
  return {
    duration,
    events,
    contacts,
    base: { kind: "lying" },
    posture,
    yields: [],
  };
}
