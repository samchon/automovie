import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { gesture } from "../everyday/gesture";
import { dance } from "../exercise/dance";
import { exercise } from "../exercise/exercise";
import { HumanActionRow } from "../law/HumanActionRow";
import { guard } from "../striking/guard";
import { kick } from "../striking/kick";
import { punch } from "../striking/punch";

/**
 * Fighting and training rows, each a row of a shipped action; a strike's
 * row leaves its target to the composition. Register the ones a film uses.
 * `hook` and `uppercut` are punches (launch to contact 0.310 s for an elite cross, other punches in proportion to their path,
 * skill, 1.06 times at novice, `IAutoMovieMotionHumanPunch`); `frontKick` is a
 * push kick (0.33 s, `IAutoMovieMotionHumanKick`); `aim` holds the pointing
 * arm 1.5 s. The jab, the cross and the rear round kick are the strike family's rows
 * (`HumanStrike`), each registered once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanDrill {
  /** A lead hook. */
  export const hook: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["hook"]
  > = HumanActionRow.of("hook", punch, {
    technique: "hook",
    hand: "lead",
  });

  /** A rear uppercut. */
  export const uppercut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["uppercut"]
  > = HumanActionRow.of("uppercut", punch, {
    technique: "uppercut",
    hand: "rear",
  });

  /** A front push kick with the lead leg, as a teep or a door kick. */
  export const frontKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["frontKick"]
  > = HumanActionRow.of("frontKick", kick, {
    technique: "push",
    leg: "lead",
  });

  /** A southpaw guard. */
  export const southpaw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["southpaw"]
  > = HumanActionRow.of("southpaw", guard, {
    stance: "southpaw",
  });

  /** Level a held thing at a target, as a weapon or a torch is aimed: the pointing arm. */
  export const aim: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["aim"]
  > = HumanActionRow.of("aim", gesture, {
    kind: "point",
    hold: 1.5,
  });

  /** Squats. */
  export const squats: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["squats"]
  > = HumanActionRow.of("squats", exercise, {
    kind: "squat",
  });

  /** Jumping jacks. */
  export const jumpingJacks: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["jumpingJacks"]
  > = HumanActionRow.of("jumpingJacks", exercise, {
    kind: "jumpingJack",
  });

  /** A sway to music. */
  export const sway: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["sway"]
  > = HumanActionRow.of("sway", dance, { kind: "sway" });
}
