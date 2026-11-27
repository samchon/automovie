import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { rest } from "../everyday/internal/rest";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_STANCE_ARMS_CROSSED } from "../next/presets/HUMAN_STANCE_ARMS_CROSSED";
import { HUMAN_STANCE_HANDS_BEHIND_HEAD } from "../next/presets/HUMAN_STANCE_HANDS_BEHIND_HEAD";
import { HUMAN_STANCE_HANDS_CLASPED } from "../next/presets/HUMAN_STANCE_HANDS_CLASPED";
import { HUMAN_STANCE_HANDS_IN_POCKETS } from "../next/presets/HUMAN_STANCE_HANDS_IN_POCKETS";
import { HUMAN_STANCE_HANDS_ON_HIPS } from "../next/presets/HUMAN_STANCE_HANDS_ON_HIPS";
import { HUMAN_STANCE_PARADE_REST } from "../next/presets/HUMAN_STANCE_PARADE_REST";
import { HUMAN_STANCE_THINKING } from "../next/presets/HUMAN_STANCE_THINKING";
import { selfAction } from "../touch/internal/selfAction";

/**
 * Named ways of standing and what a body does by itself, each a row of `rest`
 * or `selfAction`. Register the ones a film uses.
 */
export namespace HumanStance {
  /** Arms crossed on the chest. */
  export const armsCrossed: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["armsCrossed"]
  > = AutoMovieMotionHumanActionRow.of(
    "armsCrossed",
    rest,
    HUMAN_STANCE_ARMS_CROSSED,
  );

  /** Hands on the hips. */
  export const handsOnHips: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsOnHips"]
  > = AutoMovieMotionHumanActionRow.of(
    "handsOnHips",
    rest,
    HUMAN_STANCE_HANDS_ON_HIPS,
  );

  /** Hands in the pockets. */
  export const handsInPockets: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsInPockets"]
  > = AutoMovieMotionHumanActionRow.of(
    "handsInPockets",
    rest,
    HUMAN_STANCE_HANDS_IN_POCKETS,
  );

  /** Parade rest: the hands clasped behind the back. */
  export const paradeRest: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["paradeRest"]
  > = AutoMovieMotionHumanActionRow.of(
    "paradeRest",
    rest,
    HUMAN_STANCE_PARADE_REST,
  );

  /** The hands clasped in front. */
  export const handsClasped: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsClasped"]
  > = AutoMovieMotionHumanActionRow.of(
    "handsClasped",
    rest,
    HUMAN_STANCE_HANDS_CLASPED,
  );

  /** The hands behind the head. */
  export const handsBehindHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsBehindHead"]
  > = AutoMovieMotionHumanActionRow.of(
    "handsBehindHead",
    rest,
    HUMAN_STANCE_HANDS_BEHIND_HEAD,
  );

  /** The thinker: the chin on one hand, the other arm supporting its elbow. */
  export const thinking: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["thinking"]
  > = AutoMovieMotionHumanActionRow.of("thinking", rest, HUMAN_STANCE_THINKING);

  /** A victory raise of the arms. */
  export const victory: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["victory"]
  > = AutoMovieMotionHumanActionRow.of("victory", selfAction, {
    kind: "victory",
  });

  /** A fist pump. */
  export const fistPump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["fistPump"]
  > = AutoMovieMotionHumanActionRow.of("fistPump", selfAction, {
    kind: "fistPump",
  });

  /** A stretch on waking or after sitting long. */
  export const bigStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["bigStretch"]
  > = AutoMovieMotionHumanActionRow.of("bigStretch", selfAction, {
    kind: "stretch",
  });

  /** A roll of a stiff neck. */
  export const neckRoll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["neckRoll"]
  > = AutoMovieMotionHumanActionRow.of("neckRoll", selfAction, {
    kind: "neckRoll",
  });
}
