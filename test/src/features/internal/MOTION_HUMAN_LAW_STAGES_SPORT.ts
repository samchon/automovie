import type { HumanActionName, IHumanBody } from "@automovie/motions";

import { motionHumanLawSweep } from "./motionHumanLawSweep";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/** A solo law whose only required parameter is its kind. */
const kinded =
  (
    law: HumanActionName,
    kind: string,
    fixed: object,
    ...params: string[]
  ): motionHumanLawSweep.Stage =>
  (pick: motionHumanLawSweep.Pick, a: IHumanBody): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act(law, {
        kind: pick("kind") ?? kind,
        ...fixed,
        ...S.set(pick, ...params),
      }),
    );

/**
 * The stages of the exercise and sport laws: exercise repetitions, stretches,
 * dance steps, the sprint start, the gymnast's stand, martial forms, ball
 * handling, baseball postures, racket and golf postures and swimming.
 *
 * Each is performed alone where the body stands, with the counts of the
 * captures: three repetitions of an exercise, a stretch held 3 s and a dance
 * at 120 beats a minute. A row that sets a side or a depth without a kind is
 * staged on a kind that has one: the lunge for an exercise's side, the
 * cross-body stretch and the step touch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family, the counts and which kind a side row is staged on.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ten laws, the exercise and sport ones.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every law passes its row's parameters under their own names; only the default kind is chosen here.
 */
export const MOTION_HUMAN_LAW_STAGES_SPORT: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  exercise: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const side: string | undefined = pick("side");
    return S.solo(
      a,
      S.chain().act("exercise", {
        kind: pick("kind") ?? (side === undefined ? "squat" : "lunge"),
        reps: 3,
        ...S.set(pick, "depth"),
        ...(side === undefined ? {} : { side }),
      }),
    );
  },
  stretch: kinded("stretch", "crossBody", { seconds: 3 }, "side", "intensity"),
  dance: kinded("dance", "stepTouch", { bpm: 120 }, "side"),
  athletics: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(a, S.chain().act("athletics", S.set(pick, "front"))),
  gymnastics: (
    _pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => S.solo(a, S.chain().act("gymnastics", {})),
  martialArt: kinded("martialArt", "horseStance", {}),
  ballSport: kinded("ballSport", "dribble", {}, "side"),
  baseball: kinded("baseball", "catcherCrouch", {}),
  racket: kinded("racket", "readyPosition", {}, "side"),
  swim: kinded("swim", "treadWater", {}),
};
