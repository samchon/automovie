import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_BLADE_ADVANCE } from "../../next/presets/HUMAN_BLADE_ADVANCE";
import { HUMAN_BLADE_BEAT } from "../../next/presets/HUMAN_BLADE_BEAT";
import { HUMAN_BLADE_BIND } from "../../next/presets/HUMAN_BLADE_BIND";
import { HUMAN_BLADE_FEINT } from "../../next/presets/HUMAN_BLADE_FEINT";
import { HUMAN_BLADE_RETREAT } from "../../next/presets/HUMAN_BLADE_RETREAT";
import { HUMAN_BLADE_TRAVERSE } from "../../next/presets/HUMAN_BLADE_TRAVERSE";
import { HUMAN_BLADE_VOID_STEP } from "../../next/presets/HUMAN_BLADE_VOID_STEP";
import { step } from "../../striking/internal/step";
import { HumanSword } from "./HumanSword";
import { HumanSwordGuard } from "./HumanSwordGuard";
import { HumanSwordParry } from "./HumanSwordParry";
import { HumanSwordTaken } from "./HumanSwordTaken";
import { HumanSwordThrust } from "./HumanSwordThrust";

/*
 * Blade work under film names, each a row of a law of `HumanSword`,
 * `HumanSwordGuard`, `HumanSwordParry`, `HumanSwordTaken` or
 * `HumanSwordThrust`. The composition gives the held blade (`blade`, a sword
 * prop the hand picked up) and the target; with neither, the row is a solo
 * drill of the bare hand. Register the ones a film uses.
 *
 * The guard names are Liechtenauer's four, as Ringeck's gloss describes them:
 * `vomTag` (from the roof, the hilt at the shoulder), `ochs` (the ox, the hilt
 * beside the head and the point at the face), `pflug` (the plough, the hilt at
 * the hip and the point at the face) and `alber` (the fool, the point at the
 * ground).
 *
 * An exchange is three rows on two people: the attacker's `cut` or `thrust`
 * with `outcome: "parried"` and an anchor, the defender's `parry` with
 * `against` that anchor, and the defender's `riposte` after it. A parried
 * attack declared `taken` ends where it was stopped; the attacker's `taken` row
 * then keeps the blade on the defender's `bind` while it carries the blade
 * aside, and holds it there until the riposte ends.
 *
 * Every attack row keeps the blade timing of `IAutoMovieMotionHumanSword`: a
 * thrust, lunge, stab, wind and disengage reach contact on a point speed of 2.6
 * m/s at novice to 3.2 m/s at elite, a cut, slash, draw and backslash on an
 * edge speed of 6 to 10 m/s (`HumanSword.SPEED`), a path of 0.8 m taking 0.47 s
 * at elite for a thrust. A bind holds the parry for a second (provisional); the
 * footwork rows (`advance`, `retreat`, `traverse`) take one stance step, 0.35 s
 * at the reference hip (`step.PERIOD`).
 */
export namespace HumanBlade {
  /*
   * The guard a fencer waits in: the hilt low in front, the point at the
   * opponent.
   */
  export const enGarde: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["enGarde"]
  > = AutoMovieMotionHumanActionRow.of("enGarde", HumanSwordGuard.guard, {
    guard: "middle",
  });

  /*
   * Vom Tag: the hilt at the shoulder, the blade upright.
   */
  export const vomTag: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["vomTag"]
  > = AutoMovieMotionHumanActionRow.of("vomTag", HumanSwordGuard.guard, {
    guard: "shoulder",
  });

  /*
   * Ochs: the hilt beside the head, the point at the opponent's face.
   */
  export const ochs: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["ochs"]
  > = AutoMovieMotionHumanActionRow.of("ochs", HumanSwordGuard.guard, {
    guard: "ox",
  });

  /*
   * Pflug: the hilt at the hip, the point at the opponent's face.
   */
  export const pflug: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["pflug"]
  > = AutoMovieMotionHumanActionRow.of("pflug", HumanSwordGuard.guard, {
    guard: "middle",
  });

  /*
   * Alber: the hilt low, the point at the ground ahead.
   */
  export const alber: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["alber"]
  > = AutoMovieMotionHumanActionRow.of("alber", HumanSwordGuard.guard, {
    guard: "low",
  });

  /*
   * A descending cut from above.
   */
  export const cut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["cut"]
  > = AutoMovieMotionHumanActionRow.of("cut", HumanSword.cut, {
    from: "above",
  });

  /*
   * A horizontal slash from the blade hand's side.
   */
  export const slash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["slash"]
  > = AutoMovieMotionHumanActionRow.of("slash", HumanSword.cut, {
    from: "forehand",
  });

  /*
   * A rising cut from the off side, as a blade leaves its scabbard into a cut.
   */
  export const draw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["draw"]
  > = AutoMovieMotionHumanActionRow.of("draw", HumanSword.cut, {
    from: "belowBackhand",
  });

  /*
   * A thrust, with the least advance that reaches its target.
   */
  export const thrust: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["thrust"]
  > = AutoMovieMotionHumanActionRow.of("thrust", HumanSwordThrust.thrust, {});

  /*
   * A lunge: a thrust carried by the leading foot's long step, then recovered.
   */
  export const lunge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["lunge"]
  > = AutoMovieMotionHumanActionRow.of("lunge", HumanSwordThrust.thrust, {
    advance: "lunge",
  });

  /*
   * A stab with a knife or a dagger: a thrust, with the least advance that
   * reaches.
   */
  export const stab: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["stab"]
  > = AutoMovieMotionHumanActionRow.of("stab", HumanSwordThrust.thrust, {});

  /*
   * A backhand slash, the return of a forehand one.
   */
  export const backslash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["backslash"]
  > = AutoMovieMotionHumanActionRow.of("backslash", HumanSword.cut, {
    from: "backhand",
  });

  /*
   * Fencing footwork, an advance: one step forward, the stance kept.
   */
  export const advance: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["advance"]
  > = AutoMovieMotionHumanActionRow.of("advance", step, HUMAN_BLADE_ADVANCE);

  /*
   * Fencing footwork, a retreat: one step back, the stance kept.
   */
  export const retreat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["retreat"]
  > = AutoMovieMotionHumanActionRow.of("retreat", step, HUMAN_BLADE_RETREAT);

  /*
   * Fencing footwork, a traverse: one step to the left off the line.
   */
  export const traverse: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["traverse"]
  > = AutoMovieMotionHumanActionRow.of("traverse", step, HUMAN_BLADE_TRAVERSE);

  /*
   * A parry of the attack named by `against`, or of a line as a drill.
   */
  export const parry: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["parry"]
  > = AutoMovieMotionHumanActionRow.of("parry", HumanSwordParry.parry, {});

  /*
   * A beat: the blade struck against the attacker's and taken off it at once
   * (`against`).
   */
  export const beat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["beat"]
  > = AutoMovieMotionHumanActionRow.of(
    "beat",
    HumanSwordParry.parry,
    HUMAN_BLADE_BEAT,
  );

  /*
   * A bind: the parry kept on the attacker's blade for a second (provisional),
   * from which a wind or a disengage follows.
   */
  export const bind: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["bind"]
  > = AutoMovieMotionHumanActionRow.of(
    "bind",
    HumanSwordParry.parry,
    HUMAN_BLADE_BIND,
  );

  /*
   * A wind: out of a bind, the point turned in and thrust at the target without
   * leaving the blade's side. First pass: the thrust alone.
   */
  export const wind: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["wind"]
  > = AutoMovieMotionHumanActionRow.of("wind", HumanSwordThrust.thrust, {});

  /*
   * A disengage: out of a bind or past a parry, the thrust renewed at another
   * target. First pass: the thrust alone, the point's dip under the blade not
   * drawn.
   */
  export const disengage: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["disengage"]
  > = AutoMovieMotionHumanActionRow.of(
    "disengage",
    HumanSwordThrust.thrust,
    {},
  );

  /*
   * A feint: a cut shown to half its path and withdrawn (provisional share).
   */
  export const feint: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["feint"]
  > = AutoMovieMotionHumanActionRow.of(
    "feint",
    HumanSword.cut,
    HUMAN_BLADE_FEINT,
  );

  /*
   * A void: one step back out of the blade's reach, the stance kept.
   */
  export const voidStep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["voidStep"]
  > = AutoMovieMotionHumanActionRow.of("voidStep", step, HUMAN_BLADE_VOID_STEP);

  /*
   * A riposte: the thrust that answers out of a parry.
   */
  export const riposte: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["riposte"]
  > = AutoMovieMotionHumanActionRow.of("riposte", HumanSwordThrust.thrust, {});

  /*
   * A taken blade: the attacker's blade kept on the parry that took it while it
   * is carried aside, then held there until `until` ends.
   */
  export const taken: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["blade"]["taken"]
  > = AutoMovieMotionHumanActionRow.of("taken", HumanSwordTaken.taken, {});
}
