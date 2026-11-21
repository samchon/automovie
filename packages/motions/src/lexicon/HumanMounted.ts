import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedSeats } from "./HumanMountedSeats";
import { HumanMountedTimeline } from "./HumanMountedTimeline";
import { HumanRideHands } from "./HumanRideHands";
import { admitHumanMountedFigure } from "./admitHumanMountedFigure";

/** The mounted law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMounted>;

/** How far above the higher end of its way a foot that must swing over the carrier passes, thigh lengths (provisional). */
const RISE: number = 0.25;

/** A supporting part a figure can name. */
type Part = HumanMountedSeats.Part;

/** Every supporting part, in the order the contact windows list them. */
const PARTS: readonly Part[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "leftKnee",
  "rightKnee",
  "rightThigh",
];

/**
 * Plan a mounted performance on a moving carrier (`IAutoMovieMotionHumanMounted`):
 * seat figures in a carrier contact's frame, joined by transfers that keep a
 * support held through them, with each named support acquired, held and
 * released on the figures' clock and the whole carried by the carrier's
 * moving contact. Register `HumanMounted` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the law plans and how it is registered.
 * @evidence contracts/development/design.md#principled-representation One law over a closed seat vocabulary and named carrier contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law's name, cut table and planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The carrier's motion is read from the performance's prop.
 */
export const HumanMounted: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanMounted> =
  {
    name: "mounted",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    /**
     * Admit the figures, solve each seat once in the carrier contact's frame, then sample the carried key postures and the hands' holds.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the steps and the refusals the plan raises: a non-seated entry, no figure or a final bench, a bad transfer or hold, a support the seat kind lacks or does not read, a hand that changes contact, and a transfer that holds no support through it.
     * @evidence contracts/development/implementation.md#principled-implementation Each figure's key posture is solved once by `HumanMountedSeats` in the carrier contact's frame at the start; a second blends the keys by the minimum-jerk transfer share, swings a foot over the carrier where its straight way would pass through it, and is carried by the contact's moving frame (`HumanMountedFrame`); hands hold their contacts by `HumanMountRider.hold` with the ride's grip reader and closure.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, keys, arcs, clock and windows, hands, then the sampler.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Supports out of reach are refused by the seats; nothing is clamped onto a contact.
     * @evidence contracts/development/implementation.md#efficient-algorithms Planning solves one key per figure and four clearance queries per leg per transfer; a sample blends two keys, reads one carrier frame and fits each holding hand once.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Keys, arcs, windows and finger closures are prepared once per plan and shared by every sample.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its keys, arcs, clock and the carrier reader for its life; samples keep nothing.
     */
    plan(context: Context): IAutoMovieMotionHumanActionPlan {
      return plan(context);
    },
  };

/** Admit the figures, solve each seat once, then sample the carried key postures and holds. */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const { on, frame, figures }: IAutoMovieMotionHumanMounted = context.params;
  const entered: IAutoMovieMotionHumanBase = context.entry.base;
  if (entered.kind !== "seated")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entered.kind,
      feasible: { kind: "alternatives", values: ["sit", "ride", "mounted"] },
      reason: `a mounted performance is entered seated on its carrier, and the performer is ${entered.kind}`,
      fix: "sit on the carrier's seat first",
    });
  if (
    figures.length === 0 ||
    !HumanMountedSeats.sits(figures[figures.length - 1]!.seat)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "figures",
      value: figures.map(
        (f: IAutoMovieMotionHumanMounted.IFigure): string => f.seat,
      ),
      feasible: null,
      reason: "a mounted performance holds at least one figure and ends seated",
      fix: "end on an entered, aside or basic figure",
    });
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const hands: Partial<Record<AutoMovieHumanSide, string>> = {};
  figures.forEach((_: IAutoMovieMotionHumanMounted.IFigure, i: number): void =>
    admitHumanMountedFigure(on, support, figures, i, PARTS, hands),
  );

  // The figures are solved in the carrier contact's frame as it stands at the start.
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
    support,
    on,
    frame,
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const placed: IAutoMovieRigidTransform = support.frame(context.start);
  const back = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(origin.rotation),
      Vector3.subtract(point, origin.position),
    );
  const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      origin.position,
      Quaternion.rotateVector(origin.rotation, point),
    );
  const unarmed = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture => {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs.leftArm;
    delete limbs.rightArm;
    return { ...posture, limbs };
  };
  const entry: IAutoMovieMotionHumanPosture = unarmed(
    HumanMountedFrame.move(
      context.entry.posture,
      origin,
      HumanMountedFrame.LOCAL,
    ),
  );
  const seats: HumanMountedSeats.IContext = {
    body: context.body,
    entry,
    point: (id: string): IAutoMovieVector3 =>
      back(contactAt(support, id, context.start)),
    contact: (id: string): IAutoMovieAffordance =>
      support.prop.affordances!.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      )!,
    clear: (a: IAutoMovieVector3, b: IAutoMovieVector3): number => {
      let least: number = Infinity;
      for (const shape of support.prop.shapes ?? [])
        least = Math.min(
          least,
          physicalShapeSegmentDistance(placed, shape, world(a), world(b)),
        );
      return least;
    },
  };
  // A figure whose hands hold leans its trunk as far forward as brings them in reach, as the ride does (`HumanMountRider.lean`).
  const keys: IAutoMovieMotionHumanPosture[] = figures.map(
    (
      figure: IAutoMovieMotionHumanMounted.IFigure,
    ): IAutoMovieMotionHumanPosture => {
      const key: IAutoMovieMotionHumanPosture = unarmed(
        figure.seat === "aside"
          ? HumanMountedSeats.aside(seats, figure.supports!)
          : figure.seat === "bench"
            ? HumanMountedSeats.bench(seats, figure.supports!)
            : figure.seat === "basic"
              ? HumanMountedSeats.basic(seats)
              : entry,
      );
      const points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
      for (const side of ["left", "right"] as const) {
        const id: string | undefined = figure.supports?.[`${side}Hand`];
        if (id !== undefined) points[side] = seats.point(id);
      }
      return HumanMountRider.leant(
        key,
        HumanMountRider.lean(context.body, key, points),
      );
    },
  );

  // A foot whose straight way to its next place would pass through the carrier swings over it instead, through a point above the higher end.
  const arcs: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[] =
    keys.map(
      (
        key: IAutoMovieMotionHumanPosture,
        i: number,
      ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> => {
        const out: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
        for (const side of ["left", "right"] as const) {
          const a: IAutoMovieVector3 | undefined = (
            i === 0 ? entry : keys[i - 1]!
          ).limbs[`${side}Leg`]?.point;
          const b: IAutoMovieVector3 | undefined =
            key.limbs[`${side}Leg`]?.point;
          if (
            a === undefined ||
            b === undefined ||
            Vector3.distance(a, b) < 1e-6
          )
            continue;
          let clear: boolean = true;
          for (let k: number = 0; k < 4 && clear; ++k)
            clear =
              seats.clear(
                Vector3.lerp(a, b, k / 4),
                Vector3.lerp(a, b, (k + 1) / 4),
              ) >= context.body.measure.shankRadius;
          if (!clear)
            out[side] = {
              x: b.x,
              y: Math.max(a.y, b.y) + RISE * context.body.measure.thigh,
              z: (a.z + b.z) / 2,
            };
        }
        return out;
      },
    );

  // The clock, and the windows each support holds.
  const clock: HumanMountedTimeline = new HumanMountedTimeline(figures);
  const bears = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    region?: IAutoMovieMotionHumanContactWindow["region"],
  ): IAutoMovieMotionHumanContactWindow => ({
    part,
    kind,
    from: 0,
    to: 1,
    support: { kind: "prop", subject: on },
    ...(region === undefined ? {} : { region }),
  });
  const held: Set<string> = new Set(["seat"]);
  const kept: Map<string, IAutoMovieMotionHumanContactWindow> = new Map();
  for (const side of ["left", "right"] as const)
    if (context.entry.feet[side].planted) {
      held.add(`${side}Foot:entry`);
      kept.set(`${side}Foot:entry`, bears(`${side}Foot`, "plant"));
    }
  const members: Map<string, IAutoMovieMotionHumanContactWindow>[] =
    figures.map(
      (
        figure: IAutoMovieMotionHumanMounted.IFigure,
      ): Map<string, IAutoMovieMotionHumanContactWindow> => {
        const member: Map<string, IAutoMovieMotionHumanContactWindow> =
          figure.seat === "entered" ? new Map(kept) : new Map();
        if (HumanMountedSeats.sits(figure.seat))
          member.set("seat", bears("seat", "seat"));
        for (const part of PARTS) {
          const id: string | undefined = figure.supports?.[part];
          if (id !== undefined)
            member.set(`${part}:${id}`, window(part, bears));
        }
        return member;
      },
    );
  const contacts: IAutoMovieMotionHumanContactWindow[] = clock.windows(
    members,
    held,
  );

  // Hands hold their contacts by the ride's own grip reader and closure.
  const holding: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => hands[side] !== undefined,
  );
  const grips: HumanRideHands.IHands | undefined =
    holding.length === 0
      ? undefined
      : HumanRideHands.of(
          { ...context, params: { on, seconds: clock.duration, hands } },
          on,
          support,
          context.entry.posture,
          placed,
          figures[0]!.transfer,
        );
  return {
    duration: clock.duration,
    events: figures.map(
      (figure: IAutoMovieMotionHumanMounted.IFigure, i: number) => ({
        name: `${figure.seat}:${i}`,
        share: clock.arrivals[i]! / clock.duration,
      }),
    ),
    contacts,
    base: entered,
    posture: (
      at: number,
      _channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture => {
      const time: number = Math.max(0, Math.min(clock.duration, at));
      const film: number = context.start + time;
      const { index, share }: IAutoMovieMotionHumanMounted.IPhase =
        clock.at(time);
      const from: IAutoMovieMotionHumanPosture =
        index === 0 ? entry : keys[index - 1]!;
      const local: IAutoMovieMotionHumanPosture = mixHumanPosture(
        from,
        keys[index]!,
        share,
      );
      if (share > 0 && share < 1)
        for (const [side, over] of Object.entries(arcs[index]!) as [
          AutoMovieHumanSide,
          IAutoMovieVector3,
        ][]) {
          const goal: IAutoMovieMotionHumanPosture["limbs"]["leftLeg"] =
            local.limbs[`${side}Leg`]!;
          const middle: IAutoMovieVector3 = Vector3.lerp(
            from.limbs[`${side}Leg`]!.point,
            keys[index]!.limbs[`${side}Leg`]!.point,
            0.5,
          );
          local.limbs = {
            ...local.limbs,
            [`${side}Leg`]: {
              ...goal,
              point: Vector3.add(
                goal.point,
                Vector3.scale(
                  Vector3.subtract(over, middle),
                  4 * share * (1 - share),
                ),
              ),
            },
          };
        }
      const shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        local,
        HumanMountedFrame.LOCAL,
        carrier(film),
      );
      if (grips === undefined) return shown;
      const read: ReturnType<HumanRideHands.IHands["gripsAt"]> = grips.gripsAt(
        film,
        support.frame(film),
      );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...shown.limbs };
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...shown.joints,
      };
      for (const side of holding) {
        const taken: number = clock.hand(side, time);
        const grip: HumanRideHands.IMaterialGrip | undefined = read[side];
        if (taken <= 0 || grip === undefined) continue;
        const hold: ReturnType<typeof HumanMountRider.hold> =
          HumanMountRider.hold(
            context.body,
            side,
            shown,
            grip,
            taken,
            grips.closures[side] ?? {},
            resolution,
            projection,
          );
        limbs[`${side}Arm`] = hold.arm;
        Object.assign(joints, hold.fingers);
      }
      return { ...shown, limbs, joints };
    },
  };
}

/** The contact window a supporting part holds. */
function window(
  part: Part,
  bears: (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    region?: IAutoMovieMotionHumanContactWindow["region"],
  ) => IAutoMovieMotionHumanContactWindow,
): IAutoMovieMotionHumanContactWindow {
  if (part === "leftHand" || part === "rightHand") return bears(part, "grip");
  if (part === "leftFoot") return bears(part, "plant");
  if (part === "leftKnee") return bears("leftLowerLeg", "bear", "kneeLeft");
  if (part === "rightKnee") return bears("rightLowerLeg", "bear", "kneeRight");
  return bears("rightUpperLeg", "bear");
}

/** A carrier contact's world point at a film second. */
function contactAt(
  support: IAutoMovieMotionHumanPropReader,
  id: string,
  film: number,
): IAutoMovieVector3 {
  const read: ReturnType<NonNullable<typeof support.prop.point>> =
    support.prop.point?.(id, film);
  if (read !== undefined) return read.point;
  const frame: IAutoMovieRigidTransform = support.frame(film);
  const contact: IAutoMovieAffordance = support.prop.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  )!;
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, contact.frame.translation),
  );
}
