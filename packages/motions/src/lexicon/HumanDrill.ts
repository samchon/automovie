import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { gesture } from "../everyday/internal/gesture";
import { dance } from "../exercise/internal/dance";
import { exercise } from "../exercise/internal/exercise";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_MILITARY_DRILL_AIM } from "../next/presets/HUMAN_MILITARY_DRILL_AIM";
import { HUMAN_MILITARY_DRILL_FRONT_KICK } from "../next/presets/HUMAN_MILITARY_DRILL_FRONT_KICK";
import { HUMAN_MILITARY_DRILL_HOOK } from "../next/presets/HUMAN_MILITARY_DRILL_HOOK";
import { HUMAN_MILITARY_DRILL_UPPERCUT } from "../next/presets/HUMAN_MILITARY_DRILL_UPPERCUT";
import { guard } from "../striking/internal/guard";
import { kick } from "../striking/internal/kick";
import { punch } from "../striking/internal/punch";

/**
 * Fighting and training rows, each a row of a shipped action; a strike's row
 * leaves its target to the composition. Register the ones a film uses. `hook`
 * and `uppercut` are punches (launch to contact 0.310 s for an elite cross,
 * other punches in proportion to their path, skill, 1.06 times at novice,
 * `IAutoMovieMotionHumanPunch`); `frontKick` is a push kick (0.33 s,
 * `IAutoMovieMotionHumanKick`); `aim` holds the pointing arm 1.5 s. The jab,
 * the cross and the rear round kick are the strike family's rows
 * (`HumanStrike`), each registered once.
 */
export namespace HumanDrill {
  /** A lead hook. */
  export const hook: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["hook"]
  > = AutoMovieMotionHumanActionRow.of(
    "hook",
    punch,
    HUMAN_MILITARY_DRILL_HOOK,
  );

  /** A rear uppercut. */
  export const uppercut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["uppercut"]
  > = AutoMovieMotionHumanActionRow.of(
    "uppercut",
    punch,
    HUMAN_MILITARY_DRILL_UPPERCUT,
  );

  /** A front push kick with the lead leg, as a teep or a door kick. */
  export const frontKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["frontKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "frontKick",
    kick,
    HUMAN_MILITARY_DRILL_FRONT_KICK,
  );

  /** A southpaw guard. */
  export const southpaw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["southpaw"]
  > = AutoMovieMotionHumanActionRow.of("southpaw", guard, {
    stance: "southpaw",
  });

  /**
   * Level a held thing at a target, as a weapon or a torch is aimed: the
   * pointing arm.
   */
  export const aim: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["aim"]
  > = AutoMovieMotionHumanActionRow.of(
    "aim",
    gesture,
    HUMAN_MILITARY_DRILL_AIM,
  );

  /** Squats. */
  export const squats: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["squats"]
  > = AutoMovieMotionHumanActionRow.of("squats", exercise, {
    kind: "squat",
  });

  /** Jumping jacks. */
  export const jumpingJacks: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["jumpingJacks"]
  > = AutoMovieMotionHumanActionRow.of("jumpingJacks", exercise, {
    kind: "jumpingJack",
  });

  /** A sway to music. */
  export const sway: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["drill"]["sway"]
  > = AutoMovieMotionHumanActionRow.of("sway", dance, { kind: "sway" });
}
