import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { HumanActionRow } from "../law/HumanActionRow";
import { step } from "../striking/step";
import { HumanSword } from "./HumanSword";
import { HumanSwordGuard } from "./HumanSwordGuard";
import { HumanSwordParry } from "./HumanSwordParry";
import { HumanSwordThrust } from "./HumanSwordThrust";

/**
 * Blade work under film names, each a row of a law of `HumanSword`,
 * `HumanSwordGuard`, `HumanSwordParry` or `HumanSwordThrust`. The composition gives the held blade (`blade`, a sword prop the hand picked
 * up) and the target; with neither, the row is a solo drill of the bare
 * hand. Register the ones a film uses.
 *
 * The guard names are Liechtenauer's four, as Ringeck's gloss describes
 * them: `vomTag` (from the roof, the hilt at the shoulder), `ochs` (the ox,
 * the hilt beside the head and the point at the face), `pflug` (the plough,
 * the hilt at the hip and the point at the face) and `alber` (the fool, the
 * point at the ground).
 *
 * An exchange is three rows on two people: the attacker's `cut` or `thrust`
 * with `outcome: "parried"` and an anchor, the defender's `parry` with
 * `against` that anchor, and the defender's `riposte` after it.
 *
 * Every attack row keeps the blade timing of `IAutoMovieMotionHumanSword`: a
 * thrust, lunge, stab, wind and disengage reach contact on a point speed of
 * 2.6 m/s at novice to 3.2 m/s at elite, a cut, slash, draw and backslash
 * on an edge speed of 6 to 10 m/s (`HumanSword.SPEED`), a path of 0.8 m
 * taking 0.47 s at elite for a thrust. A bind holds the parry for a second
 * (provisional); the footwork rows (`advance`, `retreat`, `traverse`) take
 * one stance step, 0.35 s at the reference hip (`step.PERIOD`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what the composition gives, the guard names' source and how an exchange is written.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a registered law (`HumanActionRow`), so it is data over a law that fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanBlade {
  /** The guard a fencer waits in: the hilt low in front, the point at the opponent. */
  export const enGarde: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["enGarde"]
  > = HumanActionRow.of("enGarde", HumanSwordGuard.guard, {
    guard: "middle",
  });

  /** Vom Tag: the hilt at the shoulder, the blade upright. */
  export const vomTag: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["vomTag"]
  > = HumanActionRow.of("vomTag", HumanSwordGuard.guard, {
    guard: "shoulder",
  });

  /** Ochs: the hilt beside the head, the point at the opponent's face. */
  export const ochs: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["ochs"]
  > = HumanActionRow.of("ochs", HumanSwordGuard.guard, {
    guard: "ox",
  });

  /** Pflug: the hilt at the hip, the point at the opponent's face. */
  export const pflug: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["pflug"]
  > = HumanActionRow.of("pflug", HumanSwordGuard.guard, {
    guard: "middle",
  });

  /** Alber: the hilt low, the point at the ground ahead. */
  export const alber: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["alber"]
  > = HumanActionRow.of("alber", HumanSwordGuard.guard, {
    guard: "low",
  });

  /** A descending cut from above. */
  export const cut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["cut"]
  > = HumanActionRow.of("cut", HumanSword.cut, {
    from: "above",
  });

  /** A horizontal slash from the blade hand's side. */
  export const slash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["slash"]
  > = HumanActionRow.of("slash", HumanSword.cut, {
    from: "forehand",
  });

  /** A rising cut from the off side, as a blade leaves its scabbard into a cut. */
  export const draw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["draw"]
  > = HumanActionRow.of("draw", HumanSword.cut, {
    from: "belowBackhand",
  });

  /** A thrust, with the least advance that reaches its target. */
  export const thrust: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["thrust"]
  > = HumanActionRow.of("thrust", HumanSwordThrust.thrust, {});

  /** A lunge: a thrust carried by the leading foot's long step, then recovered. */
  export const lunge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["lunge"]
  > = HumanActionRow.of("lunge", HumanSwordThrust.thrust, {
    advance: "lunge",
  });

  /** A stab with a knife or a dagger: a thrust, with the least advance that reaches. */
  export const stab: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["stab"]
  > = HumanActionRow.of("stab", HumanSwordThrust.thrust, {});

  /** A backhand slash, the return of a forehand one. */
  export const backslash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["backslash"]
  > = HumanActionRow.of("backslash", HumanSword.cut, {
    from: "backhand",
  });

  /** Fencing footwork, an advance: one step forward, the stance kept. */
  export const advance: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["advance"]
  > = HumanActionRow.of("advance", step, {
    direction: "forward",
    steps: 1,
  });

  /** Fencing footwork, a retreat: one step back, the stance kept. */
  export const retreat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["retreat"]
  > = HumanActionRow.of("retreat", step, {
    direction: "back",
    steps: 1,
  });

  /** Fencing footwork, a traverse: one step to the left off the line. */
  export const traverse: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["traverse"]
  > = HumanActionRow.of("traverse", step, {
    direction: "left",
    steps: 1,
  });

  /** A parry of the attack named by `against`, or of a line as a drill. */
  export const parry: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["parry"]
  > = HumanActionRow.of("parry", HumanSwordParry.parry, {});

  /** A beat: the blade struck against the attacker's and taken off it at once (`against`). */
  export const beat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["beat"]
  > = HumanActionRow.of("beat", HumanSwordParry.parry, {
    hold: 0,
  });

  /** A bind: the parry kept on the attacker's blade for a second (provisional), from which a wind or a disengage follows. */
  export const bind: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["bind"]
  > = HumanActionRow.of("bind", HumanSwordParry.parry, {
    hold: 1,
  });

  /** A wind: out of a bind, the point turned in and thrust at the target without leaving the blade's side. First pass: the thrust alone. */
  export const wind: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["wind"]
  > = HumanActionRow.of("wind", HumanSwordThrust.thrust, {});

  /** A disengage: out of a bind or past a parry, the thrust renewed at another target. First pass: the thrust alone, the point's dip under the blade not drawn. */
  export const disengage: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["disengage"]
  > = HumanActionRow.of("disengage", HumanSwordThrust.thrust, {});

  /** A feint: a cut shown to half its path and withdrawn (provisional share). */
  export const feint: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["feint"]
  > = HumanActionRow.of("feint", HumanSword.cut, {
    feint: 0.5,
  });

  /** A void: one step back out of the blade's reach, the stance kept. */
  export const voidStep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["voidStep"]
  > = HumanActionRow.of("voidStep", step, {
    direction: "back",
    steps: 1,
  });

  /** A riposte: the thrust that answers out of a parry. */
  export const riposte: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["riposte"]
  > = HumanActionRow.of("riposte", HumanSwordThrust.thrust, {});
}
