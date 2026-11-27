import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { rest } from "../../everyday/internal/rest";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_STANCE_ARMS_CROSSED } from "../../next/presets/HUMAN_STANCE_ARMS_CROSSED";
import { HUMAN_STANCE_CHIN_REST } from "../../next/presets/HUMAN_STANCE_CHIN_REST";
import { HUMAN_STANCE_ELBOW_SUPPORT } from "../../next/presets/HUMAN_STANCE_ELBOW_SUPPORT";
import { HUMAN_STANCE_HANDS_BEHIND_HEAD } from "../../next/presets/HUMAN_STANCE_HANDS_BEHIND_HEAD";
import { HUMAN_STANCE_HANDS_CLASPED } from "../../next/presets/HUMAN_STANCE_HANDS_CLASPED";
import { HUMAN_STANCE_HANDS_IN_POCKETS } from "../../next/presets/HUMAN_STANCE_HANDS_IN_POCKETS";
import { HUMAN_STANCE_HANDS_ON_HIPS } from "../../next/presets/HUMAN_STANCE_HANDS_ON_HIPS";
import { HUMAN_STANCE_PARADE_REST } from "../../next/presets/HUMAN_STANCE_PARADE_REST";
import { HUMAN_STANCE_REST_SIDE } from "../../next/presets/HUMAN_STANCE_REST_SIDE";

/**
 * The rest places as rows: both hands of `rest` at one place under a name of
 * its own, the time held left open; a production gives the two hands different
 * places through `rest` itself.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 */
export namespace HumanRestRows {
  /**
   * `rest` with both hands at `side`: the arms hang; a neutral wait, listening;
   * held 2 s after the hands arrive when `seconds` is absent
   * ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restSide: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restSide"]
  > = AutoMovieMotionHumanActionRow.of(
    "restSide",
    rest,
    HUMAN_STANCE_REST_SIDE,
  );

  /**
   * `rest` with both hands at `pocket`: the hands in the front pockets; idling,
   * casual waiting; held 2 s after the hands arrive when `seconds` is absent
   * ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restPocket: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restPocket"]
  > = AutoMovieMotionHumanActionRow.of(
    "restPocket",
    rest,
    HUMAN_STANCE_HANDS_IN_POCKETS,
  );

  /**
   * `rest` with both hands at `hip`: the hands on the hips, elbows out;
   * impatience, confidence, surveying; held 2 s after the hands arrive when
   * `seconds` is absent ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restHip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restHip"]
  > = AutoMovieMotionHumanActionRow.of(
    "restHip",
    rest,
    HUMAN_STANCE_HANDS_ON_HIPS,
  );

  /**
   * `rest` with both hands at `crossed`: the arms crossed over the chest;
   * waiting, distance, defensiveness; held 2 s after the hands arrive when
   * `seconds` is absent ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restCrossed: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restCrossed"]
  > = AutoMovieMotionHumanActionRow.of(
    "restCrossed",
    rest,
    HUMAN_STANCE_ARMS_CROSSED,
  );

  /**
   * `rest` with both hands at `claspedFront`: the hands clasped in front;
   * formal waiting, humility; held 2 s after the hands arrive when `seconds` is
   * absent ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restClaspedFront: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restClaspedFront"]
  > = AutoMovieMotionHumanActionRow.of(
    "restClaspedFront",
    rest,
    HUMAN_STANCE_HANDS_CLASPED,
  );

  /**
   * `rest` with both hands at `claspedBehind`: the hands clasped behind the
   * back; strolling, at ease, inspecting; held 2 s after the hands arrive when
   * `seconds` is absent ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restClaspedBehind: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restClaspedBehind"]
  > = AutoMovieMotionHumanActionRow.of(
    "restClaspedBehind",
    rest,
    HUMAN_STANCE_PARADE_REST,
  );

  /**
   * `rest` with both hands at `behindHead`: the hands behind the head;
   * relaxing, stretching; held 2 s after the hands arrive when `seconds` is
   * absent ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restBehindHead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restBehindHead"]
  > = AutoMovieMotionHumanActionRow.of(
    "restBehindHead",
    rest,
    HUMAN_STANCE_HANDS_BEHIND_HEAD,
  );

  /**
   * `rest` with both hands at `chinRest`: the chin on a fist; thinking,
   * boredom; held 2 s after the hands arrive when `seconds` is absent
   * ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restChinRest: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restChinRest"]
  > = AutoMovieMotionHumanActionRow.of(
    "restChinRest",
    rest,
    HUMAN_STANCE_CHIN_REST,
  );

  /**
   * `rest` with both hands at `elbowSupport`: one elbow supported by the other
   * hand; considering, listening; held 2 s after the hands arrive when
   * `seconds` is absent ({@link IAutoMovieMotionHumanRest.IParams}).
   */
  export const restElbowSupport: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperRest"]["restElbowSupport"]
  > = AutoMovieMotionHumanActionRow.of(
    "restElbowSupport",
    rest,
    HUMAN_STANCE_ELBOW_SUPPORT,
  );
}
