import { type HumanChain, type IHumanBody, seated } from "@automovie/motions";

import { motionHumanLawSweep } from "./motionHumanLawSweep";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/** A chair under the body: its popliteal height, 0.1 m behind the heels. */
const seat = (a: IHumanBody): object => ({
  at: {
    x: 0,
    y: seated.popliteal(a),
    z: a.rest.get("leftFoot")!.z - 0.1,
  },
  yaw: 0,
  depth: 0.45,
});

/** Sitting down on the chair for half a second. */
const sitting = (a: IHumanBody, params: object = {}): HumanChain =>
  S.chain().act("sit", { seat: seat(a), seconds: 0.5, ...params });

/**
 * The stages of the laws that reshape the body where it stands: looking,
 * gesturing, resting the hands, bracing, bending, crouching, kneeling, lying
 * down, sitting, shifting on a seat, rising and typing.
 *
 * A look and a pointing gesture aim at a point 1 m to the side and 2 m ahead
 * at shoulder height. A bend reaches for a point 0.15 m to the hand's side,
 * at the heights and distances of the everyday captures: 0.6 shanks above
 * the ankle 0.45 m ahead for a stoop, 0.2 shanks 0.3 m ahead for a semi
 * squat, and the floor 0.3 m ahead for a squat. The chair is as high as the
 * body's popliteal height, with a 0.5 m backrest for the row that leans back
 * (a backless seat gives nothing to lean on, and the law refuses it). The keyboard stands at standing elbow height a
 * forearm and half a hand ahead of the shoulders (ANSI/HFES 100-2007).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and every staging choice with its source.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Twelve laws, the ones performed in place.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A row that needs a companion parameter (a face region needs the face-touching gesture) states it; nothing else is special-cased.
 */
export const MOTION_HUMAN_LAW_STAGES_POSTURE: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  look: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("look", {
        target: S.point(1, a.measure.shoulderHeight, 2),
        ...S.set(pick, "with", "cue"),
      }),
    ),
  gesture: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const region: string | undefined = pick("region");
    const kind: string =
      pick("kind") ?? (region === undefined ? "wave" : "touchFace");
    return S.solo(
      a,
      S.chain().act("gesture", {
        kind,
        ...(region === undefined ? {} : { region }),
        ...(kind === "point"
          ? { target: S.point(1, a.measure.shoulderHeight, 2) }
          : {}),
        ...S.set(pick, "side"),
      }),
    );
  },
  rest: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const place: string | undefined = pick("place");
    return S.solo(
      a,
      S.chain().act("rest", {
        ...(place === undefined ? {} : { left: place, right: place }),
        seconds: 1,
      }),
    );
  },
  brace: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("brace", {
        toward: S.point(0, 1.2, 2),
        ...S.set(pick, "kind"),
      }),
    ),
  bend: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const strategy: string | undefined = pick("strategy");
    const side: string | undefined = pick("side");
    const x: number = 0.15 * S.sign(side);
    const low: number = a.measure.ankleHeight;
    const toward: object =
      strategy === "squat"
        ? S.point(x, 0, 0.3)
        : strategy === "semiSquat"
          ? S.point(x, low + 0.2 * a.measure.shank, 0.3)
          : S.point(x, low + 0.6 * a.measure.shank, 0.45);
    return S.solo(
      a,
      S.chain().act("bend", {
        toward,
        ...(strategy === undefined ? {} : { strategy }),
        ...(side === undefined ? {} : { side }),
      }),
    );
  },
  crouch: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("crouch", { hold: 0.5, ...S.set(pick, "depth", "heels") }),
    ),
  kneel: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("kneel", { hold: 0.5, ...S.set(pick, "kind", "knee") }),
    ),
  lieDown: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("lieDown", S.set(pick, "position"))),
  sit: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      sitting(
        a,
        pick("back") === "lean"
          ? { back: "lean", seat: { ...seat(a), back: 0.5 } }
          : S.set(pick, "back"),
      ),
    ),
  shift: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, sitting(a).act("shift", { by: 0.12 })),
  rise: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => S.solo(a, sitting(a).act("rise", {})),
  typeText: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("typeText", {
        keyboard: {
          at: {
            x: 0,
            y: a.measure.shoulderHeight - a.measure.upperArm - 0.005,
            z:
              a.rest.get("rightUpperArm")!.z +
              a.measure.forearm +
              0.5 * a.measure.hand,
          },
          yaw: 0,
        },
        text: "hello world",
      }),
    ),
};
