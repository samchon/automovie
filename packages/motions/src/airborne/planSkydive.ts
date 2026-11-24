import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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

/** The landing fall's events in order. */
const POINTS: readonly string[] = ["calf", "thigh", "buttock", "pushUp"];

/**
 * Plan a parachute jump from a named edge to the ground at the world floor: the
 * hips follow `skydivePath`, and the body turns from the stance at the edge
 * into the arch, opens into the hang, turns the canopy with the toggles (each
 * pulled toggle's arm brought down to the flare's), flares, and lands in the
 * parachute landing fall onto the left side, its four later points of contact
 * each a contact window in order, or on the feet.
 *
 * @param context The action's context, standing at the edge facing out.
 * @returns The jump.
 * @throws {HumanRefusal} If the edge is missing or the deployment is refused by
 *   the path.
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
  // The flight ends with the flare's lowest bone, its feet, on the ground.
  const flareLow: number = stuntFallPose.lowest(
    body,
    posed(skydivePoses.FLARE),
  );
  const path: skydivePath.IPath = skydivePath.prepare(
    p,
    hips0,
    yaw,
    ground + flareOffset.y - flareLow,
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
  // An offset read at the exit's yaw, turned about +Y to a heading.
  const turned: (
    offset: IAutoMovieVector3,
    heading: number,
  ) => IAutoMovieVector3 = (
    offset: IAutoMovieVector3,
    heading: number,
  ): IAutoMovieVector3 => {
    const d: number = ((heading - yaw) * Math.PI) / 180;
    return {
      x: offset.x * Math.cos(d) + offset.z * Math.sin(d),
      y: offset.y,
      z: -offset.x * Math.sin(d) + offset.z * Math.cos(d),
    };
  };
  const place: (
    pose: IAutoMovieMotionHumanLieDown.IPose,
    hips: IAutoMovieVector3,
    heading: number,
  ) => IAutoMovieMotionHumanPosture = (
    pose: IAutoMovieMotionHumanLieDown.IPose,
    hips: IAutoMovieVector3,
    heading: number,
  ): IAutoMovieMotionHumanPosture =>
    stuntFallPose.at(
      { ...posed(pose), yaw: heading },
      hips,
      turned(offsetOf(pose), heading),
    );
  const pulled = (t: number, side: AutoMovieHumanSide): number => {
    let w: number = 0;
    for (const toggle of p.toggles ?? []) {
      if (toggle.side !== side) continue;
      const from: number = path.open + toggle.at;
      const to: number = from + toggle.hold;
      if (t > from && t < to)
        w = Math.max(w, Math.min(1, (t - from) / PULL, (to - t) / PULL));
    }
    return minimumJerk.share(w);
  };
  const lying: IAutoMovieMotionHumanLieDown.IPose = lieDown.POSES.lateralLeft;
  const keys: skydivePoses.IKey[] = [
    { at: 0, pose: skydivePoses.FLARE },
    ...skydivePoses.PLF,
    { at: 1, pose: lying },
  ];
  const touched: skydivePath.IAt = path.at(touchdown);
  const rest: IAutoMovieMotionHumanPosture = {
    ...stand.posture(body, { ...touched.hips, y: ground }, touched.heading),
    limbs: {},
  };
  const flared: IAutoMovieMotionHumanPosture = skydivePoses.at(
    skydivePoses.FLARE,
    touched.heading,
    false,
  );
  // The feet stand where the flare touched them down.
  const planted: stuntFallPose.IFeet | undefined =
    landing === "standUp"
      ? stuntFallPose.feet(
          body,
          stuntFallPose.rest(body, flared, {
            x: touched.hips.x,
            y: ground,
            z: touched.hips.z,
          }),
        )
      : undefined;

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t >= touchdown) {
      const s: number = t - touchdown;
      if (planted !== undefined)
        // The flare's bent knees straighten into the stand on the feet
        // planted where they touched down.
        return stuntFallPose.plant(
          body,
          stuntFallPose.blend(flared, rest, minimumJerk.share(s / ABSORB)),
          planted,
          ground,
        );
      const u: number = s / PLF;
      // The forward speed is spent while the feet still bear, over the first
      // quarter; the body then rolls where it came down.
      const v: number = Math.min(1, u / 0.25);
      const drift: number =
        Vector3.length(path.landing) *
        0.25 *
        PLF *
        (v - (2.5 * v ** 4 - 3 * v ** 5 + v ** 6));
      const along: IAutoMovieVector3 = Vector3.add(
        touched.hips,
        Vector3.scale(Vector3.normalize(path.landing), drift),
      );
      let k: number = 0;
      while (k < keys.length - 2 && keys[k + 1]!.at <= u) k++;
      const a: skydivePoses.IKey = keys[k]!;
      const b: skydivePoses.IKey = keys[k + 1]!;
      const w: number = minimumJerk.share((u - a.at) / (b.at - a.at));
      // The blend rests its own lowest bone on the ground.
      return stuntFallPose.rest(
        body,
        stuntFallPose.blend(
          skydivePoses.at(a.pose, touched.heading, false),
          skydivePoses.at(b.pose, touched.heading, false),
          w,
        ),
        { x: along.x, y: ground, z: along.z },
      );
    }
    const at: skydivePath.IAt = path.at(t);
    switch (at.phase) {
      case "freefall": {
        const w: number = minimumJerk.share(Math.min(1, t / EXIT_TURN));
        const from: IAutoMovieMotionHumanPosture = stuntFallPose.at(
          { ...entry, yaw: at.heading },
          at.hips,
          turned(entryOffset, at.heading),
        );
        return stuntFallPose.blend(
          from,
          place(skydivePoses.ARCH, at.hips, at.heading),
          w,
        );
      }
      case "opening":
        // The arms spread out first, then rise to the risers, wide of the head.
        return at.share < 0.5
          ? stuntFallPose.blend(
              place(skydivePoses.ARCH, at.hips, at.heading),
              place(skydivePoses.SPREAD, at.hips, at.heading),
              minimumJerk.share(at.share * 2),
            )
          : stuntFallPose.blend(
              place(skydivePoses.SPREAD, at.hips, at.heading),
              place(skydivePoses.HANG, at.hips, at.heading),
              minimumJerk.share(at.share * 2 - 1),
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
            to: share(touchdown + 0.5 * PLF),
          },
          {
            part: "rightFoot",
            kind: "bear",
            support: { kind: "ground" },
            from: share(touchdown),
            to: share(touchdown + 0.5 * PLF),
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
