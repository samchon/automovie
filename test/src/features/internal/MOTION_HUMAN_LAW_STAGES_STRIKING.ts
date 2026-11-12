import type { HumanChain, IHumanBody } from "@automovie/motions";

import { motionHumanLawSweep } from "./motionHumanLawSweep";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/** A person's guard, held facing the other person's face. */
const guard = (
  subject: "a" | "b",
  seconds: number,
  params: object = {},
): HumanChain =>
  S.chain(subject).act("guard", {
    seconds,
    facing: S.person(subject === "a" ? "b" : "a", "face"),
    ...params,
  });

/** Shoulder to fingertip, metres. */
const arm = (body: IHumanBody): number =>
  body.measure.upperArm + body.measure.forearm + body.measure.hand;

/** The punching range of the striking captures: 1.3 arms. */
const punching = (a: IHumanBody): number => 1.3 * arm(a);

/** The kicking range of the striking captures: 0.9 of the shorter leg. */
const kicking = (a: IHumanBody, b: IHumanBody): number =>
  0.9 * Math.min(a.measure.hipHeight, b.measure.hipHeight);

/**
 * The stages of the fighting laws: the guard, the fighting step, the punch,
 * the kick, the knee, the defences, the three reactions to a blow and the
 * clinch.
 *
 * The two people face each other, each in a guard. A punch is thrown at the
 * face from 1.3 arm lengths and a kick at the ribs from 0.9 of the shorter
 * leg, the ranges of the striking captures with the arm read as shoulder to
 * fingertip and the leg as hip height. A knee and a clinch start 0.55 m
 * apart. A defence answers a straight punch, except the check, which answers
 * a round kick. A reaction is to a blow from a point 1 m ahead at shoulder
 * height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family, every range and what each defence answers.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ten laws, the fighting ones.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A feint row is passed as the law's own type (a share for a punch, a flag for a kick); nothing else is converted.
 */
export const MOTION_HUMAN_LAW_STAGES_STRIKING: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  guard: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("guard", { seconds: 1, ...S.set(pick, "stance") })),
  step: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain()
        .act("guard", { seconds: 0.8 })
        .act("step", { direction: pick("direction") ?? "forward" }),
    ),
  punch: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const feint: string | undefined = pick("feint");
    return S.duo(a, b, punching(a), [
      guard("a", 0.8).act("punch", {
        technique: pick("technique") ?? "straight",
        at: S.person("b", "face"),
        ...S.set(pick, "hand", "accuracy"),
        ...(feint === "true" ? { feint: 0.5 } : {}),
      }),
      guard("b", 3),
    ]);
  },
  kick: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const feint: string | undefined = pick("feint");
    return S.duo(a, b, kicking(a, b), [
      guard("a", 0.8).act("kick", {
        technique: pick("technique") ?? "round",
        at: S.person("b", "ribsLeft"),
        ...S.set(pick, "leg", "accuracy"),
        ...(feint === undefined ? {} : { feint: feint === "true" }),
      }),
      guard("b", 3),
    ]);
  },
  knee: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.duo(a, b, 0.55, [
      guard("a", 0.8).act("knee", {
        at: S.person("b", "abdomen"),
        ...S.set(pick, "leg"),
      }),
      guard("b", 2),
    ]),
  defend: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const kind: string = pick("kind") ?? "cover";
    const checked: boolean = kind === "check";
    return S.duo(a, b, checked ? kicking(a, b) : punching(a), [
      checked
        ? guard("a", 0.8).act(
            "kick",
            { technique: "round", at: S.person("b", "ribsLeft") },
            "attack",
          )
        : guard("a", 0.8).act(
            "punch",
            { technique: "straight", at: S.person("b", "face") },
            "attack",
          ),
      guard("b", 0.8).act("defend", {
        kind,
        against: "attack",
        outcome: pick("outcome") ?? "inTime",
      }),
    ]);
  },
  flinch: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("flinch", {
        from: S.point(0, a.measure.shoulderHeight, 1),
      }),
    ),
  stagger: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("stagger", {
        from: S.point(0, a.measure.shoulderHeight, 1),
        speed: 1,
      }),
    ),
  knockdown: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("knockdown", {
        from: S.point(0, a.measure.shoulderHeight, 1),
      }),
    ),
  clinch: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.duo(a, b, 0.55, [
      S.chain().act("clinch", {
        partner: "b",
        ...S.set(pick, "grip", "hand"),
      }),
      S.chain("b").act("stand", { seconds: 4 }),
    ]),
};
