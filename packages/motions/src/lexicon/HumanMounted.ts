import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanMountedAids } from "./HumanMountedAids";
import { HumanMountedBank } from "./HumanMountedBank";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedPaths } from "./HumanMountedPaths";
import { HumanMountedSeats } from "./HumanMountedSeats";
import { HumanMountedStirrups } from "./HumanMountedStirrups";
import { HumanMountedStride } from "./HumanMountedStride";
import { HumanMountedTimeline } from "./HumanMountedTimeline";
import { HumanMountedWhip } from "./HumanMountedWhip";
import { HumanRideHands } from "./HumanRideHands";
import { admitHumanMountedFigure } from "./admitHumanMountedFigure";

/** The mounted law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMounted>;

/** A limb's joints by bone, clinical degrees `[flexion, abduction, twist]`. */
type Joints = IAutoMovieMotionHumanPosture["joints"];

/** The four limbs a key may move by a goal. */
const LIMBS: readonly AutoMovieHumanLimb[] = [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/** A supporting part a figure can name. */
type Part = HumanMountedSeats.Part;

/** Every supporting part, in the order the contact windows list them. */
const PARTS: readonly Part[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
  "leftKnee",
  "rightKnee",
  "rightThigh",
];

/**
 * Admit the figures, solve each seat once in the carrier contact's frame, then
 * sample the carried key postures and the hands' holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steps and the refusals the plan raises: a non-seated entry, no figure or a final bench, a bad transfer or hold, a support the seat kind lacks or does not read, a hand that changes contact, and a transfer that holds no support through it.
 * @evidence contracts/development/implementation.md#principled-implementation Each figure's key posture is solved once by `HumanMountedSeats` in the carrier contact's frame at the start; a second blends the keys by the minimum-jerk transfer share, each limb end's turn slerped by the same share and a foot kept on its rest turned about its ball, swings a foot over the carrier where its straight way would pass through it, and is carried by the contact's moving frame (`HumanMountedFrame`); hands hold their contacts by `HumanMountRider.hold` with the ride's grip reader and closure.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, keys, arcs, clock and windows, hands, then the sampler.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Supports out of reach are refused by the seats; nothing is clamped onto a contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms Planning solves one key per figure, four clearance queries per leg per transfer and one fit of a transfer's end whose limb a goal moves at that end alone; a sample blends two keys, reads one carrier frame and fits each holding hand once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Keys, arcs, windows and finger closures are prepared once per plan and shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its keys, arcs, clock and the carrier reader for its life; samples keep nothing.
 */
function planHumanMounted(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/**
 * Plan a mounted performance on a moving carrier
 * (`IAutoMovieMotionHumanMounted`): seat figures in a carrier contact's frame,
 * joined by transfers that keep a support held through them, with each named
 * support acquired, held and released on the figures' clock and the whole
 * carried by the carrier's moving contact. Register `HumanMounted` to use it.
 */
export const HumanMounted: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanMounted> =
  {
    name: "mounted",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    plan: planHumanMounted,
  };

/**
 * Admit the figures, solve each seat once, then sample the carried key postures
 * and holds.
 */
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
      fix: "end on an entered, aside, basic or descent figure",
    });
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const hands: Partial<Record<AutoMovieHumanSide, string>> = {};
  const stride: number | undefined = context.params.stride;
  const planted: Record<AutoMovieHumanSide, boolean> = {
    left: context.entry.feet.left.planted,
    right: context.entry.feet.right.planted,
  };
  if (stride !== undefined) HumanBound.above("stride", stride, 0, "s");
  const respond: number = context.params.respond ?? 0;
  HumanBound.within("respond", respond, 0, 1);
  figures.forEach((_: IAutoMovieMotionHumanMounted.IFigure, i: number): void =>
    admitHumanMountedFigure(
      on,
      support,
      figures,
      i,
      PARTS,
      hands,
      planted,
      stride,
    ),
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
  const entry: IAutoMovieMotionHumanPosture = HumanMountedPaths.unarmed(
    HumanMountedFrame.move(
      context.entry.posture,
      origin,
      HumanMountedFrame.LOCAL,
    ),
  );
  const gripped: Set<AutoMovieHumanSide> = HumanMountedFrame.held(
    context.body,
    context.entry.posture,
    support,
    figures[0]!,
    context.start,
  );

  // The clock, and how far the carrier strays from its stride-averaged path out of the saddle.
  const clock: HumanMountedTimeline = new HumanMountedTimeline(
    figures,
    gripped,
  );
  const slack: number = HumanMountedPaths.slack(
    carrier,
    context.start,
    clock,
    figures,
    stride,
  );
  const seats: HumanMountedSeats.IContext = {
    body: context.body,
    entry,
    slack,
    point: (id: string): IAutoMovieVector3 =>
      back(HumanMountedFrame.contact(support, id, context.start)),
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
      const key: IAutoMovieMotionHumanPosture = HumanMountedPaths.unarmed(
        HumanMountedStirrups.free(figure.seat)
          ? HumanMountedStirrups.solve(seats, figure.supports!, figure.seat)
          : figure.seat === "aside"
            ? HumanMountedSeats.aside(seats, figure.supports!)
            : figure.seat === "bench"
              ? HumanMountedSeats.bench(seats, figure.supports!)
              : figure.seat === "basic"
                ? HumanMountedSeats.basic(seats)
                : HumanMountedPaths.entered(
                    context.body,
                    entry,
                    figure,
                    planted,
                  ),
      );
      const points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
      for (const side of ["left", "right"] as const) {
        const id: string | undefined = figure.supports?.[`${side}Hand`];
        if (id !== undefined) points[side] = seats.point(id);
      }
      // A bank seat sets its own trunk, kept in space; its hands take the reins where they are.
      return HumanMountedBank.bank(figure.seat)
        ? HumanMountedBank.key(context.body, figure.seat, key)
        : HumanMountRider.leant(
            key,
            HumanMountRider.lean(context.body, key, points),
          );
    },
  );

  const hipsOf = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    HumanMountedPaths.hips(context.body, posture);
  const middles: IAutoMovieVector3[] = keys.map(hipsOf);
  const arcs: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[] =
    HumanMountedPaths.arcs(seats, entry, keys, figures, planted);
  // The ball each foot kept on its rest pivots about through each transfer.
  const pivots: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[] =
    keys.map(
      (
        key: IAutoMovieMotionHumanPosture,
        i: number,
      ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> => {
        const out: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
        for (const side of ["left", "right"] as const) {
          const ball: IAutoMovieVector3 | undefined = HumanMountedPaths.rested(
            i === 0 ? entry : keys[i - 1]!,
            key,
            side,
          );
          if (ball !== undefined) out[side] = ball;
        }
        return out;
      },
    );
  // A limb a goal moves at one end of a transfer and its joints at the other: the goal's end fitted once here, so the transfer blends joints to joints instead of holding the goal and dropping it at an end.
  const handoff = (
    index: number,
  ): Partial<Record<AutoMovieHumanLimb, Joints>> => {
    const before: IAutoMovieMotionHumanPosture =
      index === 0 ? entry : keys[index - 1]!;
    const after: IAutoMovieMotionHumanPosture = keys[index]!;
    const out: Partial<Record<AutoMovieHumanLimb, Joints>> = {};
    const fitted: Map<IAutoMovieMotionHumanPosture, IAutoMoviePose> = new Map();
    for (const limb of LIMBS) {
      const a: IAutoMovieHumanLimbGoal | undefined = before.limbs[limb];
      const b: IAutoMovieHumanLimbGoal | undefined = after.limbs[limb];
      if ((a === undefined) === (b === undefined)) continue;
      const end: IAutoMovieMotionHumanPosture =
        a === undefined ? after : before;
      let pose: IAutoMoviePose | undefined = fitted.get(end);
      if (pose === undefined) {
        pose = resolveHumanPosture(context.body, end);
        fitted.set(end, pose);
      }
      const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
      const joints: Joints = {};
      for (const joint of pose.joints)
        if (
          joint.bone === chain.upper ||
          joint.bone === chain.lower ||
          joint.bone === chain.effector
        )
          joints[joint.bone] = [
            joint.flexion ?? 0,
            joint.abduction ?? 0,
            joint.twist ?? 0,
          ];
      out[limb] = joints;
    }
    return out;
  };
  const handoffs: Partial<Record<AutoMovieHumanLimb, Joints>>[] = keys.map(
    (_: IAutoMovieMotionHumanPosture, i: number) => handoff(i),
  );

  // The windows each support holds.
  // The entry's planted feet are held on the stirrups the first figure names, or on whatever they rest on.
  const held: Set<string> = new Set(["seat"]);
  for (const side of gripped)
    held.add(`${side}Hand:${figures[0]!.supports![`${side}Hand`]}`);
  const kept: Map<string, IAutoMovieMotionHumanContactWindow> = new Map();
  for (const side of ["left", "right"] as const)
    if (context.entry.feet[side].planted) {
      const named: string | undefined = figures[0]!.supports?.[`${side}Foot`];
      const key: string = `${side}Foot:${named ?? "entry"}`;
      held.add(key);
      kept.set(key, HumanMountedPaths.window(`${side}Foot`, on, named));
    }
  const members: Map<string, IAutoMovieMotionHumanContactWindow>[] =
    figures.map(
      (
        figure: IAutoMovieMotionHumanMounted.IFigure,
      ): Map<string, IAutoMovieMotionHumanContactWindow> => {
        const member: Map<string, IAutoMovieMotionHumanContactWindow> =
          figure.seat === "entered" && !HumanMountedPaths.names(figure)
            ? new Map(kept)
            : new Map();
        if (HumanMountedSeats.sits(figure.seat))
          member.set("seat", {
            part: "seat",
            kind: "seat",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: on },
          });
        for (const part of PARTS) {
          const id: string | undefined = figure.supports?.[part];
          if (id !== undefined)
            member.set(`${part}:${id}`, HumanMountedPaths.window(part, on, id));
        }
        return member;
      },
    );
  const aids: HumanMountedAids.IGiven[] = HumanMountedAids.given(
    context.cue,
    context.start,
    clock.duration,
    context.params.aids ?? [],
    context.params.aided,
  );
  const strokes: HumanMountedWhip.IStroke[] = HumanMountedWhip.strokes(
    context.cue,
    context.start,
    figures,
    clock,
  );
  const contacts: IAutoMovieMotionHumanContactWindow[] = HumanMountedWhip.split(
    clock.windows(members, held),
    strokes,
    clock.duration,
  );

  // Hands hold their contacts by the ride's own grip reader and closure.
  const holding: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => hands[side] !== undefined,
  );
  const grips: HumanRideHands.IHands | undefined =
    holding.length === 0
      ? undefined
      : HumanRideHands.of(
          { ...context, params: { on, duration: clock.duration, hands } },
          on,
          support,
          // The hands take and close on their holds in the first figure's key posture, where the transfer brings them, not in the entry's.
          HumanMountedFrame.move(keys[0]!, HumanMountedFrame.LOCAL, origin),
          placed,
          figures[0]!.transfer,
          // A hand that enters holding keeps the crossing its rein is displayed with.
          {
            pose: context.entry.pose,
            holding: gripped,
            posture: context.entry.posture,
          },
        );
  return {
    duration: clock.duration,
    // Each figure's arrival, then each whip stroke's contact.
    events: [
      ...figures.map(
        (figure: IAutoMovieMotionHumanMounted.IFigure, i: number) => ({
          name: `${figure.seat}:${i}`,
          share: clock.arrivals[i]! / clock.duration,
        }),
      ),
      ...strokes.map((stroke: HumanMountedWhip.IStroke, k: number) => ({
        name: `whip:${k}`,
        share: stroke.at / clock.duration,
      })),
      ...aids.map((aid: HumanMountedAids.IGiven, k: number) => ({
        name: `aid:${aid.kind}:${k}`,
        share: aid.onset / clock.duration,
      })),
    ],
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
      // A transfer between two keys turns each limb's end the same share as it moves it, rather than holding the earlier key's turn until it snaps at the arrival; a foot kept on its rest turns about the ball on it, so the ball stays on the rest.
      if (share > 0 && share < 1)
        for (const limb of [
          "leftArm",
          "rightArm",
          "leftLeg",
          "rightLeg",
        ] as const) {
          const a: IAutoMovieHumanLimbGoal | undefined = from.limbs[limb];
          const b: IAutoMovieHumanLimbGoal | undefined =
            keys[index]!.limbs[limb];
          const goal: IAutoMovieHumanLimbGoal | undefined = local.limbs[limb];
          if (
            goal === undefined ||
            a?.rotation === undefined ||
            b?.rotation === undefined
          )
            continue;
          const rotation: IAutoMovieQuaternion = Quaternion.slerp(
            a.rotation,
            b.rotation,
            share,
          );
          const ball: IAutoMovieVector3 | undefined =
            limb === "leftLeg"
              ? pivots[index]!.left
              : limb === "rightLeg"
                ? pivots[index]!.right
                : undefined;
          local.limbs = {
            ...local.limbs,
            [limb]: {
              ...goal,
              rotation,
              ...(ball === undefined || goal.contact === undefined
                ? {}
                : {
                    point: Vector3.subtract(
                      ball,
                      Quaternion.rotateVector(rotation, goal.contact),
                    ),
                  }),
            },
          };
        }
      if (share > 0 && share < 1)
        for (const [limb, fitted] of Object.entries(handoffs[index]!) as [
          AutoMovieHumanLimb,
          Joints,
        ][]) {
          const goalFirst: boolean = from.limbs[limb] !== undefined;
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
            ...local.limbs,
          };
          delete limbs[limb];
          const joints: IAutoMovieMotionHumanPosture["joints"] = {
            ...local.joints,
          };
          for (const [bone, angles] of Object.entries(fitted) as [
            AutoMovieHumanoidBone,
            readonly [number, number, number],
          ][]) {
            const other: readonly [number, number, number] = (goalFirst
              ? keys[index]!
              : from
            ).joints[bone] ?? [0, 0, 0];
            const [a, b] = goalFirst ? [angles, other] : [other, angles];
            joints[bone] = [
              a[0] + (b[0] - a[0]) * share,
              a[1] + (b[1] - a[1]) * share,
              a[2] + (b[2] - a[2]) * share,
            ];
          }
          local.limbs = limbs;
          local.joints = joints;
        }
      // The hips travel between the keys while the pelvis turns about them, swinging about feet kept on their stirrups so no leg is stretched or folded past both ends.
      if (share > 0 && share < 1)
        local.root = Vector3.add(
          local.root,
          Vector3.subtract(
            HumanMountedPaths.swing(
              index === 0 ? hipsOf(entry) : middles[index - 1]!,
              middles[index]!,
              HumanMountedPaths.pivot(from, keys[index]!),
              share,
            ),
            hipsOf(local),
          ),
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
      // The trunk leans against the carrier's own pitch and roll by the author's share, and in a bank seat keeps its inclination in space.
      const now: IAutoMovieRigidTransform = carrier(film);
      const moved: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        HumanMountedBank.respond(
          context.body,
          HumanMountedPaths.heels(
            context.body,
            HumanMountedAids.body(aids, time, local),
          ),
          figures,
          { index, share },
          origin.rotation,
          now.rotation,
          respond,
          HumanMountedPaths.grips(support, figures[index]!, now, film),
          respond === 0 ? 0 : HumanMountedFrame.surge(carrier, film, stride),
        ),
        HumanMountedFrame.LOCAL,
        now,
      );

      // Out of the saddle the pelvis rides the stride-averaged path, faded in and out over the transfers.
      const level: number =
        stride === undefined
          ? 0
          : HumanMountedStirrups.blend(
              figures,
              index,
              share,
              (p: HumanMountedStirrups.IProfile): number => p.decouple,
            );
      const shown: IAutoMovieMotionHumanPosture =
        level === 0
          ? moved
          : {
              ...moved,
              root: Vector3.lerp(
                moved.root,
                HumanMountedStride.level(carrier, film, local.root, stride!),
                level,
              ),
            };
      if (grips === undefined) return shown;
      const riding = (i: number): boolean =>
        i >= 0 && figures[i]!.handRide === true;
      const pushed: number =
        (riding(index)
          ? riding(index - 1)
            ? 1
            : share
          : riding(index - 1)
            ? 1 - share
            : 0) *
        HumanMountedStride.PUSH *
        context.body.measure.forearm;
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
        const reading: HumanRideHands.IMaterialGrip | undefined = read[side];
        if (taken <= 0 || reading === undefined) continue;
        // Out of the saddle the hands take the reins shorter, forward on the neck.
        const shortened: HumanRideHands.IMaterialGrip =
          HumanMountedStride.along(
            HumanMountedAids.rein(
              aids,
              side,
              time,
              reading,
              context.body.measure.forearm,
            ),
            HumanMountedBank.reins(figures, { index, share }) *
              context.body.measure.forearm,
          );
        const grip: HumanRideHands.IMaterialGrip =
          pushed === 0
            ? shortened
            : HumanMountedStride.push(shortened, time, stride!, pushed);
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
      // A striking hand leaves its rein for the stroke and returns to it.
      HumanMountedWhip.strike(context.body, shown, limbs, strokes, time);
      return { ...shown, limbs, joints };
    },
  };
}
