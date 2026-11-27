import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { brace } from "../everyday/internal/brace";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_DEFENCE_CHECK_KICK } from "../next/presets/HUMAN_DEFENCE_CHECK_KICK";
import { HUMAN_DEFENCE_COVER } from "../next/presets/HUMAN_DEFENCE_COVER";
import { HUMAN_DEFENCE_ELBOW_BLOCK } from "../next/presets/HUMAN_DEFENCE_ELBOW_BLOCK";
import { HUMAN_DEFENCE_HAND_PARRY } from "../next/presets/HUMAN_DEFENCE_HAND_PARRY";
import { HUMAN_DEFENCE_HIGH_BLOCK } from "../next/presets/HUMAN_DEFENCE_HIGH_BLOCK";
import { HUMAN_DEFENCE_ROLL_UNDER } from "../next/presets/HUMAN_DEFENCE_ROLL_UNDER";
import { HUMAN_DEFENCE_SLIP } from "../next/presets/HUMAN_DEFENCE_SLIP";
import { HUMAN_DEFENCE_SWAY_BACK } from "../next/presets/HUMAN_DEFENCE_SWAY_BACK";
import { defend } from "../striking/internal/defend";

/**
 * The defences as rows on the grammar: each named defence is a row of `defend`,
 * the law that owns the defender's role and the outcome shared with the strike
 * it answers, and the brace a row of `brace`, a base adaptation. The
 * composition gives the strike answered (`against`) and, where the scene
 * decides it, the outcome.
 *
 * | Row                                                          | Law      | Fixed              |
 * | ------------------------------------------------------------ | -------- | ------------------ |
 * | `cover`, `handParry`, `elbowBlock`, `highBlock`, `checkKick` | `defend` | the block          |
 * | `slip`, `rollUnder`, `swayBack`                              | `defend` | the evasion        |
 * | `braceImpact`, `bracePush`                                   | `brace`  | what is braced for |
 *
 * Every `defend` row shares one timing ({@link IAutoMovieMotionHumanDefend}):
 * the defender starts after a reaction time of about 0.3 s less the
 * anticipation the strike's preparation shows, and its limb or head takes 0.30
 * s at novice to 0.20 s at elite to move, so against a rear straight of 0.310 s
 * a defence is in time only when it anticipates, and a kick or a fast strike is
 * met late by a novice. `slip`, `rollUnder` and `swayBack` fit a punch;
 * `cover`, `elbowBlock` and `highBlock` fit a punch or a kick to the guarded
 * region; `checkKick` fits a kick to the leg. The `brace` rows set the stance
 * for an impact or a push and state no time.
 *
 * `handParry`, `rollUnder` and `swayBack` are named apart from the blade's
 * `parry`, the regrasp's `roll` and the drill's `sway`, so a name a performance
 * registers is one row.
 *
 * Each `defend` row fixes the kind of the preset of the same name in
 * `AutoMovieMotionHumanDefence` (`COVER`, `SLIP` and the rest), so the values
 * are written once.
 */
export namespace HumanDefence {
  /** Both forearms brought up to cover the head. */
  export const cover: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["cover"]
  > = AutoMovieMotionHumanActionRow.of("cover", defend, HUMAN_DEFENCE_COVER);

  /** The incoming fist deflected by the hand. */
  export const handParry: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["handParry"]
  > = AutoMovieMotionHumanActionRow.of(
    "handParry",
    defend,
    HUMAN_DEFENCE_HAND_PARRY,
  );

  /** A body strike taken on the elbow. */
  export const elbowBlock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["elbowBlock"]
  > = AutoMovieMotionHumanActionRow.of(
    "elbowBlock",
    defend,
    HUMAN_DEFENCE_ELBOW_BLOCK,
  );

  /** A high strike taken on the raised forearm. */
  export const highBlock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["highBlock"]
  > = AutoMovieMotionHumanActionRow.of(
    "highBlock",
    defend,
    HUMAN_DEFENCE_HIGH_BLOCK,
  );

  /** A kick checked with the raised shin. */
  export const checkKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["checkKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "checkKick",
    defend,
    HUMAN_DEFENCE_CHECK_KICK,
  );

  /** The head moved off the line of a straight punch. */
  export const slip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["slip"]
  > = AutoMovieMotionHumanActionRow.of("slip", defend, HUMAN_DEFENCE_SLIP);

  /** The body rolled under a hook. */
  export const rollUnder: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["rollUnder"]
  > = AutoMovieMotionHumanActionRow.of(
    "rollUnder",
    defend,
    HUMAN_DEFENCE_ROLL_UNDER,
  );

  /** The trunk swayed back from a strike. */
  export const swayBack: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["swayBack"]
  > = AutoMovieMotionHumanActionRow.of(
    "swayBack",
    defend,
    HUMAN_DEFENCE_SWAY_BACK,
  );

  /** The stance widened and lowered for an impact. */
  export const braceImpact: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["braceImpact"]
  > = AutoMovieMotionHumanActionRow.of("braceImpact", brace, {
    kind: "impact",
  });

  /** The stance set against a push. */
  export const bracePush: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["defence"]["bracePush"]
  > = AutoMovieMotionHumanActionRow.of("bracePush", brace, {
    kind: "push",
  });
}
