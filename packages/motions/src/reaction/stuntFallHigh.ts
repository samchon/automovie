import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStuntFall,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { lieDown } from "../floor/lieDown";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { stuntFallPose } from "./stuntFallPose";

/** Take-off speed along the heading for a step, metres per second (provisional). */
const STEP: number = 0.8;

/**
 * Take-off speed against the heading for a tip, metres per second
 * (provisional).
 */
const TIP: number = 0.6;

/**
 * Take-off speed along the heading for a throw, metres per second
 * (provisional).
 */
const THROW: number = 2.4;

/**
 * The hips' height above a surface the body lies flat on, metres (provisional:
 * the trunk's half depth).
 */
const FLAT: number = 0.12;

/**
 * How far a pad yields under the landing, metres (provisional: a stunt airbag's
 * give).
 */
const YIELD: number = 0.15;

/** Seconds the landing takes to settle (provisional). */
const SETTLE: number = 0.4;

/**
 * Fall from a ledge: the hips leave with the take-off's velocity and follow the
 * drag-free projectile while the body turns from standing to lying on its back,
 * reaching the flat by the first contact. A named pad's top takes that contact
 * and yields `YIELD` under it; without a pad the body lands on the ground in a
 * collapse. A descender instead holds the body upright and caps its descent at
 * the authored speed, landing standing.
 *
 * @param context The action's context, standing on the ledge.
 * @param p The high fall.
 * @returns The fall, ending lying on the pad or ground, or standing after a
 *   descender.
 * @throws {HumanRefusal} If the pad has no top, or the flight's first contact
 *   misses the pad's top.
 */
export function stuntFallHigh(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStuntFall.IParams>,
  p: IAutoMovieMotionHumanStuntFall.IHigh,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const g: number = AutoMovieGravity.STANDARD;
  const yaw: number = context.entry.posture.yaw;
  const forward: IAutoMovieVector3 = HumanFrame.forward(yaw);
  const entry: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const hips0: IAutoMovieVector3 = entry.get("hips")!.worldPosition;
  const exit: IAutoMovieMotionHumanStuntFall.Exit = p.exit ?? "step";
  const v0: IAutoMovieVector3 =
    exit === "tip"
      ? Vector3.scale(forward, -TIP)
      : Vector3.scale(forward, exit === "thrown" ? THROW : STEP);

  // The landing: a pad's top or the ground, and the hips' height on it.
  let base: number = 0;
  let pad: IPad | undefined;
  if (p.pad !== undefined) {
    pad = padTop(context, p.pad, p.top ?? "surface");
    base = pad.centre.y;
  }
  const descend: boolean = p.descender !== undefined;
  const target: number = base + (descend ? body.measure.hipHeight : FLAT);
  const drop: number = hips0.y - target;
  if (!(drop > 0))
    throw refusal(
      "pad",
      p.pad ?? "ground",
      "the landing is not below the ledge",
    );

  // Free fall, or a descent capped at the descender's speed.
  const cap: number = p.descender ?? Infinity;
  const free: number = Math.min(drop, (cap * cap) / (2 * g));
  const freeTime: number = Math.sqrt((2 * free) / g);
  const flight: number =
    freeTime + (drop - free) / (cap === Infinity ? 1 : cap);
  const heightAt = (t: number): number =>
    t <= freeTime
      ? hips0.y - 0.5 * g * t * t
      : hips0.y - free - cap * (t - freeTime);
  const touch: IAutoMovieVector3 = {
    ...Vector3.add(hips0, Vector3.scale(v0, flight)),
    y: target,
  };
  if (pad !== undefined) {
    const local: IAutoMovieVector3 = Vector3.subtract(touch, pad.centre);
    if (
      Math.abs(Vector3.dot(local, pad.across)) > pad.width / 2 ||
      Math.abs(Vector3.dot(local, pad.along)) > pad.depth / 2
    )
      throw refusal(
        "pad",
        p.pad,
        "the fall's first contact misses the pad's top",
      );
  }
  const duration: number = flight + SETTLE;
  const lying: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw,
    pitch: lieDown.POSES.supine.pitch,
    roll: lieDown.POSES.supine.roll,
    joints: lieDown.POSES.supine.joints,
    limbs: {},
  };
  const stood: IAutoMovieMotionHumanPosture = {
    ...stand.posture(body, { ...touch, y: base }, yaw),
    limbs: {},
  };
  const flatOffset: IAutoMovieVector3 = stuntFallPose.offset(body, lying);
  const upright: IAutoMovieMotionHumanPosture = {
    ...context.entry.posture,
    limbs: {},
  };
  const uprightOffset: IAutoMovieVector3 = stuntFallPose.offset(body, upright);

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    const flying: number = Math.min(t, flight);
    const hips: IAutoMovieVector3 = {
      ...Vector3.add(hips0, Vector3.scale(v0, flying)),
      y: heightAt(flying),
    };
    if (descend) {
      // Landed on the feet, the body eases into the stand over the settle.
      const shown: IAutoMovieMotionHumanPosture = stuntFallPose.at(
        upright,
        hips,
        uprightOffset,
      );
      if (t < flight) return shown;
      return stuntFallPose.blend(
        shown,
        stood,
        minimumJerk.share((t - flight) / SETTLE),
      );
    }
    // The pad yields under the landing and the body settles on it.
    const sink: number =
      t <= flight || pad === undefined
        ? 0
        : YIELD * Math.sin(Math.PI * minimumJerk.share((t - flight) / SETTLE));
    const turn: number = minimumJerk.share(Math.min(1, flying / flight));
    const a: IAutoMovieMotionHumanPosture = stuntFallPose.at(
      upright,
      hips,
      uprightOffset,
    );
    const b: IAutoMovieMotionHumanPosture = stuntFallPose.at(
      lying,
      { ...hips, y: hips.y - sink },
      flatOffset,
    );
    return stuntFallPose.blend(a, b, turn);
  };
  const lands: IAutoMovieMotionHumanContactWindow["support"] =
    p.pad === undefined ? { kind: "ground" } : { kind: "prop", subject: p.pad };
  return {
    duration,
    events: [
      { name: "takeoff", share: 0 },
      { name: "touchdown", share: flight / duration },
    ],
    contacts: descend
      ? [
          {
            part: "leftFoot",
            kind: "bear",
            support: lands,
            from: flight / duration,
            to: 1,
          },
          {
            part: "rightFoot",
            kind: "bear",
            support: lands,
            from: flight / duration,
            to: 1,
          },
        ]
      : [
          {
            part: "back",
            kind: "lie",
            support: lands,
            from: flight / duration,
            to: 1,
          },
        ],
    base: { kind: descend ? "standing" : "lying" },
    posture,
    yields: [],
  };
}

/** A pad's top in world metres. */
interface IPad {
  /** Its centre. */
  centre: IAutoMovieVector3;

  /** Unit axis across its width. */
  across: IAutoMovieVector3;

  /** Unit axis along its depth. */
  along: IAutoMovieVector3;

  /** Its width, metres. */
  width: number;

  /** Its depth, metres. */
  depth: number;
}

/** Read a pad's top surface. */
function padTop(
  context: IAutoMovieMotionHumanActionContext,
  subject: string,
  id: string,
): IPad {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const top: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
    (item: IAutoMovieAffordance): boolean => item.id === id,
  );
  if (top?.width === undefined || top.depth === undefined)
    throw refusal("top", id, `${subject} has no dimensioned top ${id}`);
  const world: IAutoMovieRigidTransform = reader.frame(context.start);
  const turn: IAutoMovieQuaternion = Quaternion.multiply(
    world.rotation,
    top.frame.rotation,
  );
  return {
    centre: Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, top.frame.translation),
    ),
    across: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
    along: Quaternion.rotateVector(turn, { x: 0, y: 0, z: 1 }),
    width: top.width,
    depth: top.depth,
  };
}

/** The high fall's refusal. */
function refusal(axis: string, value: unknown, reason: string): HumanRefusal {
  return new HumanRefusal({
    kind: "reach",
    axis,
    value,
    reason,
    fix: "stage the pad under the fall's path or change the take-off",
  });
}
