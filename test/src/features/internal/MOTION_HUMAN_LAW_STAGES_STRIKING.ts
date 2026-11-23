import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import type { MotionHumanSweepChain } from "./MotionHumanSweepChain";
import { motionHumanLawSweep } from "./motionHumanLawSweep";
import { motionKickTarget } from "./motionKickTarget";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/** A person's guard, held facing the other person's face. */
const guard = (
  subject: "a" | "b",
  seconds: number,
  params: object = {},
): MotionHumanSweepChain =>
  S.chain(subject).act("guard", {
    duration: seconds,
    facing: S.person(subject === "a" ? "b" : "a", "face"),
    ...params,
  });

/** Shoulder to fingertip, metres. */
const arm = (body: IAutoMovieMotionHumanBody): number =>
  body.measure.upperArm + body.measure.forearm + body.measure.hand;

/** The punching range of the striking captures: 1.3 arms. */
const punching = (a: IAutoMovieMotionHumanBody): number => 1.3 * arm(a);

/** The kicking range of the striking captures: 0.9 of the shorter leg. */
const kicking = (
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): number => 0.9 * Math.min(a.measure.hipHeight, b.measure.hipHeight);

/**
 * The stages of the fighting laws: the guard, the fighting step, the punch,
 * the kick, the knee, the defences, the three reactions to a blow and the
 * clinch.
 *
 * The two people face each other, each in a guard. A punch is thrown at the
 * face from 1.3 arm lengths and a kick from 0.9 of the shorter leg, a round
 * kick at the flank its leg faces and a push kick at the abdomen
 * (`motionKickTarget`), the ranges of the striking captures with the arm read as shoulder to
 * fingertip and the leg as hip height. A knee and a clinch start 0.55 m
 * apart. A defence answers a straight punch, except the check, which answers
 * a round kick. A reaction is to a blow from a point 1 m ahead at shoulder
 * height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family, every range and what each defence answers.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ten laws, the fighting ones.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A feint row is passed as the law's own share (0.5, below the kick's chamber share for every practical seed); nothing else is converted.
 */
export const MOTION_HUMAN_LAW_STAGES_STRIKING: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  guard: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("guard", { duration: 1, ...S.set(pick, "stance") }),
    ),
  step: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain()
        .act("guard", { duration: 0.8 })
        .act("step", { direction: pick("direction") ?? "forward" }),
    ),
  punch: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene => {
    const feint: string | undefined = pick("feint");
    // The partner's guard settles by 0.6 s, and a puncher reads it a
    // reaction time before the launch (`HumanPerception.REACTION`): launched
    // at 0.8 s, a jab perceived the guard still settling and planned on a
    // face extrapolated 10 cm farther than it came to rest. Launched at 1 s,
    // it perceives the partner at rest, the target a straight punch's
    // signature describes; the guard settling during the perception is
    // `test_human_motion_strike_punch_settling_guard`'s.
    return S.duo(a, b, punching(a), [
      guard("a", 1).act("punch", {
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
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene => {
    const feint: string | undefined = pick("feint");
    // Launched at 1 s, as the punch is and for the same reason: the kicker
    // reads the partner a reaction time before the launch
    // (`HumanPerception.REACTION`), and launched at 0.8 s it read their guard
    // still settling (until 0.6 s) and planned on a trunk extrapolated past
    // where it came to rest: on the small woman the push kick's corrections
    // then brought the point 3 cm nearer and the knee landed folded 49.5
    // degrees. The kick a signature describes is thrown at a guard at rest.
    return S.duo(a, b, kicking(a, b), [
      guard("a", 1).act("kick", {
        technique: pick("technique") ?? "round",
        at: S.person("b", motionKickTarget(pick("technique"), pick("leg"))),
        ...S.set(pick, "leg", "accuracy"),
        ...(feint === "true" ? { feint: 0.5 } : {}),
      }),
      guard("b", 3),
    ]);
  },
  knee: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
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
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
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
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("flinch", {
        target: S.point(0, a.measure.shoulderHeight, 1),
      }),
    ),
  stagger: (
    _pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("stagger", {
        target: S.point(0, a.measure.shoulderHeight, 1),
        speed: 1,
      }),
    ),
  knockdown: (
    _pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("knockdown", {
        target: S.point(0, a.measure.shoulderHeight, 1),
      }),
    ),
  // A scene carries no forces, so `perturb` meets no impulse and absorbs
  // nothing: the still stance its law states for that case.
  perturb: (
    _pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("stand", { hold: 0.3 }).act("perturb", {})),
  clinch: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.duo(a, b, 0.55, [
      S.chain().act("clinch", {
        partner: "b",
        ...S.set(pick, "grip", "hand"),
      }),
      S.chain("b").act("stand", { hold: 4, sway: 0 }),
    ]),
};
