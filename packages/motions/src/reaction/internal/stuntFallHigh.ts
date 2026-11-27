import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStuntFall,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { lieDown } from "../../floor/internal/lieDown";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanMaterialContact } from "../../posture/HumanMaterialContact";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
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
  const top: string = p.top ?? "surface";
  const pad: HumanMaterialContact.ISite | undefined =
    p.pad === undefined
      ? undefined
      : HumanMaterialContact.prepare(context.prop(p.pad), top, context.start);
  if (p.pad !== undefined && pad === undefined)
    throw refusal("top", top, `${p.pad} has no dimensioned top ${top}`);
  if (
    pad !== undefined &&
    Quaternion.rotateVectorY(
      pad.at(context.start).frame.rotation,
      HumanMaterialContact.NORMAL,
    ) <
      1 - 1e-12
  )
    throw refusal("top", top, "the stunt pad needs a level receiving face");
  const base: number = pad?.at(context.start).frame.position.y ?? 0;
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
  const nominal: number = Math.sqrt((2 * free) / g) + (drop - free) / cap;
  const capTime: number = cap / g;
  const heightAt = (t: number): number =>
    t <= capTime
      ? hips0.y - 0.5 * g * t * t
      : hips0.y - (cap * cap) / (2 * g) - cap * (t - capTime);
  const hipsAt = (time: number): IAutoMovieVector3 => ({
    ...Vector3.add(hips0, Vector3.scale(v0, time)),
    y: heightAt(time),
  });
  const lying: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw,
    pitch: lieDown.POSES.supine.pitch,
    roll: lieDown.POSES.supine.roll,
    joints: lieDown.POSES.supine.joints,
    limbs: {},
  };
  const flatOffset: IAutoMovieVector3 = stuntFallPose.offset(body, lying);
  const upright: IAutoMovieMotionHumanPosture = {
    ...context.entry.posture,
    limbs: {},
  };
  const uprightOffset: IAutoMovieVector3 = stuntFallPose.offset(body, upright);

  const flying = (time: number): IAutoMovieMotionHumanPosture => {
    const hips: IAutoMovieVector3 = hipsAt(time);
    const a: IAutoMovieMotionHumanPosture = stuntFallPose.at(
      upright,
      hips,
      uprightOffset,
    );
    if (descend) return a;
    return stuntFallPose.blend(
      a,
      stuntFallPose.at(lying, hips, flatOffset),
      minimumJerk.share(time / nominal),
    );
  };
  const exterior:
    | ReturnType<typeof HumanMaterialContact.preparePosture>
    | undefined =
    pad === undefined ? undefined : HumanMaterialContact.preparePosture(body);
  const observation = (
    shape: IAutoMovieMotionHumanPosture,
    time: number,
  ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined =>
    pad === undefined
      ? undefined
      : exterior!(shape, pad.at(context.start + time));
  const arrival: ReturnType<typeof HumanMaterialContact.arrival> =
    pad === undefined
      ? undefined
      : HumanMaterialContact.arrival(
          nominal + SETTLE,
          (
            time: number,
          ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined =>
            observation(flying(time), time),
        );
  if (pad !== undefined && arrival === undefined)
    throw refusal("pad", p.pad, "the fall's exterior misses the pad's top");
  const flight: number = arrival?.seconds ?? nominal;
  const duration: number = flight + SETTLE;
  const touch: IAutoMovieVector3 = hipsAt(flight);
  const contacted: IAutoMovieMotionHumanPosture = flying(flight);
  const endpoint: IAutoMovieMotionHumanPosture = descend
    ? { ...stand.posture(body, { ...touch, y: base }, yaw), limbs: {} }
    : stuntFallPose.at(lying, touch, flatOffset);
  const settled = (time: number): IAutoMovieMotionHumanPosture =>
    stuntFallPose.blend(contacted, endpoint, minimumJerk.share(time / SETTLE));
  const fit: ((seconds: number) => number[]) | undefined =
    pad === undefined
      ? undefined
      : prepareHumanSampledCourse({
          from: 0,
          to: SETTLE,
          sample: (time: number): readonly number[] => {
            const raw: IAutoMovieMotionHumanPosture = settled(time);
            const fit:
              | IAutoMovieMotionHumanContactWindow.IMaterial
              | undefined = observation(raw, flight + time);
            if (fit === undefined)
              throw refusal(
                "pad",
                p.pad,
                "the body leaves the pad while settling",
              );
            return [fit.clearance];
          },
          tolerance: { kind: "absolute", absolute: 0.0005 },
          step: 1 / 120,
        });
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t <= flight) return flying(t);
    const time: number = t - flight;
    const shown: IAutoMovieMotionHumanPosture = settled(time);
    if (fit === undefined) return shown;
    const sink: number = descend
      ? 0
      : YIELD * Math.sin(Math.PI * minimumJerk.share(time / SETTLE));
    shown.root.y -= fit(time)[0]! + sink;
    return shown;
  };
  const lands: IAutoMovieMotionHumanContactWindow["support"] = pad?.support ?? {
    kind: "ground",
  };
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
            ...(arrival === undefined ? {} : { material: arrival.material }),
            from: flight / duration,
            to: 1,
          },
        ],
    base: { kind: descend ? "standing" : "lying" },
    posture,
    yields: [],
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
