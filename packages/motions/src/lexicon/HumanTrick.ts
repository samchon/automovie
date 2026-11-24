import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTrick,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTrick>;
/** The alternatives of `BindLimb`'s site. */
type BindLimb = "leftLeg" | "rightLeg" | "leftArm" | "rightArm";

/** A limb's binding to a carrier contact in a figure. */
interface IBind {
  /** The limb. */
  limb: BindLimb;

  /** The carrier contact, or `object` for a pickup's prop. */
  contact: string;
}

/** A figure's key: its posture in the seat's frame and its limbs' bindings. */
interface IKey {
  /** The posture, in the seat contact's frame. */
  posture: IAutoMovieMotionHumanPosture;

  /** The limbs bound to contacts. */
  binds: IBind[];
}

/**
 * Admit the figures, lay each key once, then sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the refusals: no figure or a last figure out of the seat, a bad time, a pickup without its prop, and a pickup whose prop lies beyond the leaning hand's reach.
 * @evidence contracts/development/implementation.md#principled-implementation Keys from the body's measures in the seat's frame; bound limbs take their contact's point each sample; the pickup's reach is checked against the leaned shoulder at the figure's hold.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, keys, clock and windows, then the sampler.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable pickup is refused, never stretched.
 * @evidence contracts/development/implementation.md#efficient-algorithms A sample blends two keys and reads one frame and at most four contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The keys are shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the keys and the carrier reader.
 */
function planHumanTrick(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/**
 * Trick-riding figures (`IAutoMovieMotionHumanTrick`): each figure is a key
 * posture in the seat contact's moving frame whose feet and hands are bound to
 * the trick saddle's own straps, horn and handholds (or a pickup's prop) read
 * where the carrier has them at each second; keys blend by a minimum-jerk share
 * over each transfer and are carried by the seat contact. Every attitude and
 * offset is a provisional stage reading. Register `HumanTrick` to use it.
 */
export const HumanTrick: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTrick> =
  {
    name: "trick",
    interrupts: {},
    plan: planHumanTrick,
  };
/** The record of `IPlanAtResult`'s site. */
type IPlanAtResult = { index: number; share: number };

/** Admit, lay the keys and sample. */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const { on, frame, figures }: IAutoMovieMotionHumanTrick = context.params;
  if (figures.length === 0 || figures[figures.length - 1]!.kind !== "seat")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "figures",
      value: figures.map((f) => f.kind),
      feasible: null,
      reason:
        "trick riding holds at least one figure and ends back in the seat",
      fix: "end on a seat figure",
    });
  figures.forEach(
    (figure: IAutoMovieMotionHumanTrick.IFigure, i: number): void => {
      HumanBound.above(`figures.${i}.transfer`, figure.transfer, 0, "s");
      HumanBound.least(`figures.${i}.seconds`, figure.hold, 0, "s");
      if (figure.kind === "pickup" && figure.object === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: `figures.${i}.object`,
          value: undefined,
          feasible: null,
          reason: "a pickup takes a prop from the ground, and none is named",
          fix: "name the prop the pickup takes",
        });
    },
  );
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
    support,
    on,
    frame,
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const entry: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
    context.entry.posture,
    origin,
    HumanMountedFrame.LOCAL,
  );
  const keys: IKey[] = figures.map((figure) =>
    key(context.body, entry, figure),
  );

  // The clock: each figure's transfer then its hold.
  const starts: number[] = [];
  let clock: number = 0;
  for (const figure of figures) {
    starts.push(clock);
    clock += figure.transfer + figure.hold;
  }
  const duration: number = clock;
  const at = (t: number): IPlanAtResult => {
    let index: number = 0;
    while (index + 1 < figures.length && t >= starts[index + 1]!) ++index;
    return {
      index,
      share: minimumJerk.share(
        Math.min(1, (t - starts[index]!) / figures[index]!.transfer),
      ),
    };
  };
  const point = (
    contact: string,
    figure: IAutoMovieMotionHumanTrick.IFigure,
    film: number,
  ): IAutoMovieVector3 =>
    contact === "object"
      ? context.prop(figure.object!).frame(film).position
      : HumanMountedFrame.contact(support, contact, film);

  // A pickup's prop must lie within the leaning arm's reach at the figure's hold.
  figures.forEach((figure, i: number): void => {
    if (figure.kind !== "pickup") return;
    const film: number = context.start + starts[i]! + figure.transfer;
    const shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
      keys[i]!.posture,
      HumanMountedFrame.LOCAL,
      carrier(film),
    );
    const m = context.body.measure;
    const shoulder: IAutoMovieVector3 = Vector3.add(shown.root, {
      x: 0,
      y: m.shoulderHeight - m.hipHeight,
      z: 0,
    });
    const gap: number = Vector3.distance(
      shoulder,
      point("object", figure, film),
    );
    const reach: number =
      m.upperArm + m.forearm + m.hand + (m.shoulderHeight - m.hipHeight);
    if (gap > reach)
      throw new HumanRefusal({
        kind: "reach",
        axis: `figures.${i}.object`,
        value: gap,
        feasible: { kind: "range", minimum: 0, maximum: reach, unit: "m" },
        reason: `the prop lies ${gap.toFixed(3)} m from the leaning shoulder, beyond the arm's ${reach.toFixed(3)} m`,
        fix: "ride the horse nearer the prop",
      });
  });

  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  keys.forEach((k: IKey, i: number): void => {
    const from: number = (starts[i]! + figures[i]!.transfer) / duration;
    const to: number = i + 1 < figures.length ? starts[i + 1]! / duration : 1;
    if (figures[i]!.kind === "seat")
      contacts.push({
        part: "seat",
        kind: "seat",
        from,
        to,
        support: { kind: "prop", subject: on },
      });
    for (const bind of k.binds)
      contacts.push({
        part:
          bind.limb === "leftLeg"
            ? "leftFoot"
            : bind.limb === "rightLeg"
              ? "rightFoot"
              : bind.limb === "leftArm"
                ? "leftHand"
                : "rightHand",
        kind: bind.limb.endsWith("Leg") ? "plant" : "grip",
        from,
        to,
        support:
          bind.contact === "object"
            ? { kind: "prop", subject: figures[i]!.object! }
            : { kind: "prop", subject: on },
      });
  });
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: figures.map((figure, i: number) => ({
      name: `${figure.kind}:${i}`,
      share: (starts[i]! + figure.transfer) / duration,
    })),
    contacts,
    base: context.entry.base,
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const film: number = context.start + t;
      const { index, share } = at(t);
      const before: IAutoMovieMotionHumanPosture =
        index === 0 ? legsOnly(entry) : keys[index - 1]!.posture;
      const now: IAutoMovieRigidTransform = carrier(film);
      let shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        mixHumanPosture(before, keys[index]!.posture, share),
        HumanMountedFrame.LOCAL,
        now,
      );
      // Bound limbs take their contacts as the figure arrives.
      for (const bind of keys[index]!.binds) {
        const p: IAutoMovieVector3 = point(bind.contact, figures[index]!, film);
        if (bind.limb.endsWith("Arm"))
          shown = HumanUnseatPose.reach(
            shown,
            bind.limb === "leftArm" ? "left" : "right",
            p,
            share,
          );
        else {
          const goal = shown.limbs[bind.limb];
          const ankle: IAutoMovieVector3 = Vector3.add(p, {
            x: 0,
            y: context.body.measure.ankleHeight,
            z: 0,
          });
          shown = {
            ...shown,
            limbs: {
              ...shown.limbs,
              [bind.limb]: {
                point:
                  goal === undefined
                    ? ankle
                    : Vector3.lerp(goal.point, ankle, share),
                // The knee bends toward a point ahead of the foot at the knee's height.
                bend: Vector3.add(
                  ankle,
                  Quaternion.rotateVector(now.rotation, {
                    x: 0,
                    y: context.body.measure.shank,
                    z: context.body.measure.shank,
                  }),
                ),
                planted: share >= 1,
              },
            },
          };
        }
      }
      return shown;
    },
  };
  // A pickup's arms, the horn hand and the reaching hand, are laid as planned courses over its figure: the reach in its transfer and the hold; after the hold the arms keep the angles their course ended with, carried into the next figure.
  const pickups: number[] = figures.flatMap((figure, i: number): number[] =>
    figure.kind === "pickup" ? [i] : [],
  );
  if (pickups.length === 0) return goals;
  if (pickups.length > 1)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "figures",
      value: pickups,
      feasible: null,
      reason: "trick riding takes one pickup an act",
      fix: "split the pickups into acts of their own",
    });
  const p: number = pickups[0]!;
  const ready: number = starts[p]! + figures[p]!.transfer;
  const relax: number = ready + figures[p]!.hold;
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: starts[p]!,
    ready,
    relax,
    end: relax,
  };
  const side: AutoMovieHumanSide = figures[p]!.side ?? "left";
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  return HumanMountedFrame.coursed(
    goals,
    carrier,
    context.start,
    (local: IAutoMovieMotionHumanActionPlan) =>
      courseArmGoal({
        context,
        plan: local,
        side,
        span,
        with: [
          {
            side: other,
            span,
          },
        ],
      }),
  );
}

/**
 * A posture with its leg goals only: the arms are laid by the act's course,
 * never by goals carried from the entry.
 */
function legsOnly(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  return {
    ...posture,
    limbs: {
      ...(posture.limbs.leftLeg === undefined
        ? {}
        : { leftLeg: posture.limbs.leftLeg }),
      ...(posture.limbs.rightLeg === undefined
        ? {}
        : { rightLeg: posture.limbs.rightLeg }),
    },
  };
}

/** A figure's key posture in the seat's frame and its bindings. */
function key(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  figure: IAutoMovieMotionHumanTrick.IFigure,
): IKey {
  const m = body.measure;
  const side: AutoMovieHumanSide = figure.side ?? "left";
  const sign: number = side === "left" ? 1 : -1;
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const base: IAutoMovieMotionHumanPosture = {
    ...entry,
    limbs: {},
    joints: {},
  };
  if (figure.kind === "seat") return { posture: legsOnly(entry), binds: [] };
  if (figure.kind === "hippodrome")
    return {
      posture: {
        ...base,
        root: { x: 0, y: m.hipHeight, z: -0.15 },
        yaw: 0,
        pitch: 0,
        roll: 0,
      },
      binds: [
        { limb: "leftLeg", contact: "hippodrome" },
        { limb: "rightLeg", contact: "hippodrome" },
      ],
    };
  if (figure.kind === "sideDrag")
    return {
      posture: {
        ...base,
        root: { x: sign * (m.hipHalfWidth + 0.35), y: -m.thigh, z: 0.05 },
        yaw: 0,
        pitch: 0,
        roll: -sign * 150,
      },
      binds: [{ limb: `${side}Leg`, contact: `${side}Strap` }],
    };
  if (figure.kind === "backDrag")
    return {
      posture: {
        ...base,
        root: { x: 0, y: -0.1, z: -0.65 },
        yaw: 0,
        pitch: -150,
        roll: 0,
      },
      binds: [
        { limb: "leftLeg", contact: "leftStrap" },
        { limb: "rightLeg", contact: "rightStrap" },
      ],
    };
  return {
    posture: {
      ...base,
      root: { x: sign * 0.25, y: 0.05, z: -0.1 },
      yaw: 0,
      pitch: 30,
      roll: -sign * 70,
    },
    binds: [
      { limb: `${other}Arm`, contact: "horn" },
      { limb: `${other}Leg`, contact: `${other}Strap` },
      { limb: `${side}Arm`, contact: "object" },
    ],
  };
}
