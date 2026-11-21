import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSkydive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { lieDown } from "../floor/lieDown";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { stuntFallPose } from "../reaction/stuntFallPose";
import { skydivePath } from "./skydivePath";
import { skydivePoses } from "./skydivePoses";

/** Seconds the exit takes to turn from standing into the arch (provisional). */
const EXIT_TURN: number = 1;

/** Seconds a toggle takes to come down or go back up (provisional). */
const PULL: number = 0.3;

/** Seconds of the parachute landing fall (provisional). */
const PLF: number = 1.2;

/** Seconds a stand-up landing takes to absorb (provisional). */
const ABSORB: number = 0.5;

/** How deep the hips dip in a stand-up landing, a share of the hip height (provisional). */
const DIP: number = 0.15;

/** The landing fall's events in order. */
const POINTS: readonly string[] = ["calf", "thigh", "buttock", "pushUp"];

/**
 * Plan a parachute jump from a named edge to the ground at the world floor:
 * the hips follow `skydivePath`, and the body turns from the stance at the
 * edge into the arch, opens into the hang, turns the canopy with the toggles
 * (each pulled toggle's arm brought down to the flare's), flares, and lands
 * in the parachute landing fall onto the left side, its four later points
 * of contact each a contact window in order, or on the feet.
 *
 * @param context The action's context, standing at the edge facing out.
 * @returns The jump.
 * @throws {HumanRefusal} If the edge is missing or the deployment is refused by the path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the poses, the landing and its contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Each posture is the phase's key poses blended by minimum jerk and placed with its hips on the path; the landing fall's hips descend through the keys' heights.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the edge, prepare the path, then one posture writer over the flight and the landing.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flight is the path's closed form; the durations are provisional and stated as such.
 * @evidence contracts/development/implementation.md#efficient-algorithms A few resolves at plan time; constant work per sample.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the path and the placed key postures' offsets.
 */
export function planSkydive(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSkydive.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanSkydive.IParams = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const edge: IAutoMovieAffordance | undefined = context
    .prop(p.from)
    .prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean =>
        item.id === p.edge && item.kind === "ledge",
    );
  if (edge === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "edge",
      value: p.edge,
      reason: `${p.from} has no ledge ${p.edge} to jump from`,
      fix: "name a ledge of the prop the performer stands at",
    });
  const yaw: number = context.entry.posture.yaw;
  const hips0: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
    "hips",
  )!.worldPosition;
  const ground: number = 0;
  const posed = (
    pose: IAutoMovieMotionHumanLieDown.IPose,
    mirror: boolean = false,
  ): IAutoMovieMotionHumanPosture => skydivePoses.at(pose, yaw, mirror);
  const flareOffset: IAutoMovieVector3 = stuntFallPose.offset(
    body,
    posed(skydivePoses.FLARE),
  );
  const path: skydivePath.IPath = skydivePath.prepare(
    p,
    hips0,
    yaw,
    ground + flareOffset.y,
  );
  const landing: IAutoMovieMotionHumanSkydive.Landing = p.landing ?? "plf";
  const touchdown: number = path.touchdown;
  const duration: number = touchdown + (landing === "plf" ? PLF : ABSORB);

  const entry: IAutoMovieMotionHumanPosture = {
    ...context.entry.posture,
    limbs: {},
  };
  const offsets: Map<IAutoMovieMotionHumanLieDown.IPose, IAutoMovieVector3> =
    new Map();
  const offsetOf = (
    pose: IAutoMovieMotionHumanLieDown.IPose,
  ): IAutoMovieVector3 => {
    let found: IAutoMovieVector3 | undefined = offsets.get(pose);
    if (found === undefined)
      offsets.set(pose, (found = stuntFallPose.offset(body, posed(pose))));
    return found;
  };
  const entryOffset: IAutoMovieVector3 = stuntFallPose.offset(body, entry);
  const place = (
    pose: IAutoMovieMotionHumanLieDown.IPose,
    hips: IAutoMovieVector3,
    heading: number,
  ): IAutoMovieMotionHumanPosture =>
    stuntFallPose.at({ ...posed(pose), yaw: heading }, hips, offsetOf(pose));
  const pulled = (t: number, side: "left" | "right"): number => {
    let w: number = 0;
    for (const toggle of p.toggles ?? []) {
      if (toggle.side !== side) continue;
      const from: number = path.open + toggle.at;
      const to: number = from + toggle.seconds;
      if (t > from && t < to)
        w = Math.max(w, Math.min(1, (t - from) / PULL, (to - t) / PULL));
    }
    return minimumJerk.share(w);
  };
  const lying: IAutoMovieMotionHumanLieDown.IPose = lieDown.POSES.lateralLeft;
  const keys: skydivePoses.IKey[] = [
    {
      at: 0,
      hips: flareOffset.y / body.measure.hipHeight,
      pose: skydivePoses.FLARE,
    },
    ...skydivePoses.PLF,
    { at: 1, hips: offsetOf(lying).y / body.measure.hipHeight, pose: lying },
  ];
  const touched: skydivePath.IAt = path.at(touchdown);
  const rest: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    {
      ...Vector3.add(touched.hips, Vector3.scale(path.landing, ABSORB / 2)),
      y: ground,
    },
    touched.heading,
  );

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t >= touchdown) {
      const s: number = t - touchdown;
      if (landing === "standUp") {
        const w: number = minimumJerk.share(s / ABSORB);
        const from: IAutoMovieMotionHumanPosture = place(
          skydivePoses.FLARE,
          touched.hips,
          touched.heading,
        );
        const blended: IAutoMovieMotionHumanPosture = stuntFallPose.blend(
          from,
          rest,
          w,
        );
        return {
          ...blended,
          root: {
            ...blended.root,
            y:
              blended.root.y -
              DIP * body.measure.hipHeight * Math.sin(Math.PI * w),
          },
        };
      }
      const u: number = s / PLF;
      const drift: number =
        Vector3.length(path.landing) *
        PLF *
        (u - (2.5 * u ** 4 - 3 * u ** 5 + u ** 6));
      const along: IAutoMovieVector3 = Vector3.add(
        touched.hips,
        Vector3.scale(Vector3.normalize(path.landing), drift),
      );
      let k: number = 0;
      while (k < keys.length - 2 && keys[k + 1]!.at <= u) k++;
      const a: skydivePoses.IKey = keys[k]!;
      const b: skydivePoses.IKey = keys[k + 1]!;
      const w: number = minimumJerk.share((u - a.at) / (b.at - a.at));
      const height: number =
        ground + (a.hips + (b.hips - a.hips) * w) * body.measure.hipHeight;
      const hips: IAutoMovieVector3 = { ...along, y: height };
      return stuntFallPose.blend(
        place(a.pose, hips, touched.heading),
        place(b.pose, hips, touched.heading),
        w,
      );
    }
    const at: skydivePath.IAt = path.at(t);
    switch (at.phase) {
      case "freefall": {
        const w: number = minimumJerk.share(Math.min(1, t / EXIT_TURN));
        const from: IAutoMovieMotionHumanPosture = stuntFallPose.at(
          { ...entry, yaw: at.heading },
          at.hips,
          entryOffset,
        );
        return stuntFallPose.blend(
          from,
          place(skydivePoses.ARCH, at.hips, at.heading),
          w,
        );
      }
      case "opening":
        return stuntFallPose.blend(
          place(skydivePoses.ARCH, at.hips, at.heading),
          place(skydivePoses.HANG, at.hips, at.heading),
          minimumJerk.share(at.share),
        );
      case "canopy": {
        const hang: IAutoMovieMotionHumanPosture = place(
          skydivePoses.HANG,
          at.hips,
          at.heading,
        );
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...hang.joints,
        };
        for (const side of ["left", "right"] as const) {
          const w: number = pulled(t, side);
          if (w === 0) continue;
          for (const bone of [`${side}UpperArm`, `${side}LowerArm`] as const) {
            const from: readonly [number, number, number] =
              skydivePoses.HANG.joints[bone]!;
            const to: readonly [number, number, number] =
              skydivePoses.FLARE.joints[bone]!;
            joints[bone] = [
              from[0] + (to[0] - from[0]) * w,
              from[1] + (to[1] - from[1]) * w,
              from[2] + (to[2] - from[2]) * w,
            ];
          }
        }
        return { ...hang, joints };
      }
      case "flare":
        return stuntFallPose.blend(
          place(skydivePoses.HANG, at.hips, at.heading),
          place(skydivePoses.FLARE, at.hips, at.heading),
          minimumJerk.share(at.share),
        );
    }
  };

  const share = (seconds: number): number => seconds / duration;
  const contacts: IAutoMovieMotionHumanContactWindow[] =
    landing === "standUp"
      ? [
          {
            part: "leftFoot",
            kind: "plant",
            support: { kind: "ground" },
            from: share(touchdown),
            to: 1,
          },
          {
            part: "rightFoot",
            kind: "plant",
            support: { kind: "ground" },
            from: share(touchdown),
            to: 1,
          },
        ]
      : [
          {
            part: "leftFoot",
            kind: "bear",
            support: { kind: "ground" },
            from: share(touchdown),
            to: share(touchdown + 0.25 * PLF),
          },
          {
            part: "rightFoot",
            kind: "bear",
            support: { kind: "ground" },
            from: share(touchdown),
            to: share(touchdown + 0.25 * PLF),
          },
          {
            part: "leftLowerLeg",
            kind: "bear",
            support: { kind: "ground" },
            from: share(touchdown + 0.15 * PLF),
            to: share(touchdown + 0.4 * PLF),
          },
          {
            part: "leftUpperLeg",
            kind: "bear",
            support: { kind: "ground" },
            from: share(touchdown + 0.35 * PLF),
            to: share(touchdown + 0.6 * PLF),
          },
          {
            part: "seat",
            kind: "seat",
            support: { kind: "ground" },
            from: share(touchdown + 0.55 * PLF),
            to: share(touchdown + 0.8 * PLF),
          },
          {
            part: "back",
            kind: "lie",
            support: { kind: "ground" },
            from: share(touchdown + 0.75 * PLF),
            to: 1,
          },
        ];
  return {
    duration,
    events: [
      { name: "exit", share: 0 },
      { name: "deploy", share: share(path.deploy) },
      { name: "open", share: share(path.open) },
      { name: "flare", share: share(path.flare) },
      { name: "touchdown", share: share(touchdown) },
      ...(landing === "plf"
        ? POINTS.map((name: string, i: number) => ({
            name,
            share: share(touchdown + skydivePoses.PLF[i]!.at * PLF),
          }))
        : []),
    ],
    contacts,
    base: { kind: landing === "plf" ? "lying" : "standing" },
    posture,
    yields: [],
  };
}
