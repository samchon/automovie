import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { selfAction } from "../../touch/internal/selfAction";

/*
 * The actions on one's own body as rows: each kind of `selfAction` under a name
 * of its own, the side, the count and the manner open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 */
export namespace HumanSelfActionRows {
  /*
   * `selfAction` of kind `stretch`: both arms overhead, palms up, 6 s in all
   * (the yawn's duration, Provine 1986, unverified); waking, tiredness, relief
   * (selfAction.YAWN).
   */
  export const selfStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["selfStretch"]
  > = AutoMovieMotionHumanActionRow.of("selfStretch", selfAction, {
    kind: "stretch",
  });

  /*
   * `selfAction` of kind `victory`: both fists raised overhead and outside the
   * shoulders, held 0.8 s after the rise; winning, triumph (Hwang and Matsumoto
   * 2014; times provisional, selfAction).
   */
  export const selfVictory: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["selfVictory"]
  > = AutoMovieMotionHumanActionRow.of("selfVictory", selfAction, {
    kind: "victory",
  });

  /*
   * `selfAction` of kind `fistPump`: a fist at eye height dropped a fifth of
   * the arm and raised again 3 times of 0.4 s, 1.2 s in all after the rise; a
   * small win, determination (provisional, selfAction).
   */
  export const selfFistPump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["selfFistPump"]
  > = AutoMovieMotionHumanActionRow.of("selfFistPump", selfAction, {
    kind: "fistPump",
  });

  /*
   * `selfAction` of kind `neckRoll`: the head circled through a light share of
   * its range, 2 circles of 1.0 s, 2.0 s in all after the rise; loosening up,
   * tension (provisional, selfAction).
   */
  export const selfNeckRoll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["selfNeckRoll"]
  > = AutoMovieMotionHumanActionRow.of("selfNeckRoll", selfAction, {
    kind: "neckRoll",
  });

  /*
   * `selfAction` of kind `shoulderRoll`: both shoulders circled through a light
   * share of their range, 2 circles of 1.0 s, 2.0 s in all after the rise;
   * loosening up, tension (provisional, selfAction).
   */
  export const selfShoulderRoll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["selfShoulderRoll"]
  > = AutoMovieMotionHumanActionRow.of("selfShoulderRoll", selfAction, {
    kind: "shoulderRoll",
  });
}
