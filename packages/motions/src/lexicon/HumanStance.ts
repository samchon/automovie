import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { rest } from "../everyday/rest";
import { HumanActionRow } from "../law/HumanActionRow";
import { HUMAN_STANCE_ARMS_CROSSED } from "../next/presets/HUMAN_STANCE_ARMS_CROSSED";
import { HUMAN_STANCE_HANDS_BEHIND_HEAD } from "../next/presets/HUMAN_STANCE_HANDS_BEHIND_HEAD";
import { HUMAN_STANCE_HANDS_CLASPED } from "../next/presets/HUMAN_STANCE_HANDS_CLASPED";
import { HUMAN_STANCE_HANDS_IN_POCKETS } from "../next/presets/HUMAN_STANCE_HANDS_IN_POCKETS";
import { HUMAN_STANCE_HANDS_ON_HIPS } from "../next/presets/HUMAN_STANCE_HANDS_ON_HIPS";
import { HUMAN_STANCE_PARADE_REST } from "../next/presets/HUMAN_STANCE_PARADE_REST";
import { HUMAN_STANCE_THINKING } from "../next/presets/HUMAN_STANCE_THINKING";
import { selfAction } from "../touch/selfAction";

/**
 * Named ways of standing and what a body does by itself, each a row of `rest`
 * or `selfAction`. Register the ones a film uses.
 */
export namespace HumanStance {
  /** Arms crossed on the chest. */
  export const armsCrossed: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["armsCrossed"]
  > = HumanActionRow("armsCrossed", rest, HUMAN_STANCE_ARMS_CROSSED);

  /** Hands on the hips. */
  export const handsOnHips: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsOnHips"]
  > = HumanActionRow("handsOnHips", rest, HUMAN_STANCE_HANDS_ON_HIPS);

  /** Hands in the pockets. */
  export const handsInPockets: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsInPockets"]
  > = HumanActionRow("handsInPockets", rest, HUMAN_STANCE_HANDS_IN_POCKETS);

  /** Parade rest: the hands clasped behind the back. */
  export const paradeRest: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["paradeRest"]
  > = HumanActionRow("paradeRest", rest, HUMAN_STANCE_PARADE_REST);

  /** The hands clasped in front. */
  export const handsClasped: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsClasped"]
  > = HumanActionRow("handsClasped", rest, HUMAN_STANCE_HANDS_CLASPED);

  /** The hands behind the head. */
  export const handsBehindHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["handsBehindHead"]
  > = HumanActionRow("handsBehindHead", rest, HUMAN_STANCE_HANDS_BEHIND_HEAD);

  /** The thinker: the chin on one hand, the other arm supporting its elbow. */
  export const thinking: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["thinking"]
  > = HumanActionRow("thinking", rest, HUMAN_STANCE_THINKING);

  /** A victory raise of the arms. */
  export const victory: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["victory"]
  > = HumanActionRow("victory", selfAction, {
    kind: "victory",
  });

  /** A fist pump. */
  export const fistPump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["fistPump"]
  > = HumanActionRow("fistPump", selfAction, {
    kind: "fistPump",
  });

  /** A stretch on waking or after sitting long. */
  export const bigStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["bigStretch"]
  > = HumanActionRow("bigStretch", selfAction, {
    kind: "stretch",
  });

  /** A roll of a stiff neck. */
  export const neckRoll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stance"]["neckRoll"]
  > = HumanActionRow("neckRoll", selfAction, {
    kind: "neckRoll",
  });
}
