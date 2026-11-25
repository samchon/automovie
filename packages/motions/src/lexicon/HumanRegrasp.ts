import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { regrasp } from "../handling/regrasp";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * A held object moved within or with the hand, without being put down: each a
 * row of `regrasp`. Register the ones a film uses
 * (`HumanPerformance.IInput.laws`, `HumanChain.extend`).
 */
export namespace HumanRegrasp {
  /**
   * A key or a cap turned about its own axis by the wrist, the grip held. A
   * quarter turn takes 0.6 s, longer or shorter in proportion to the angle
   * (provisional: no measured time); a key, a cap, a doorknob.
   */
  export const twist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["regrasp"]["twist"]
  > = HumanActionRow("twist", regrasp, { kind: "twist" });

  /**
   * The object shifted in the still hand to another of its grips. A grip change
   * takes 0.6 s (provisional); shifting a tool or a pen in the hand.
   */
  export const regrip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["regrasp"]["regrip"]
  > = HumanActionRow("regrip", regrasp, {
    kind: "regrip",
  });

  /**
   * A small round object rolled across the fingers. A roll across the fingers
   * takes 0.6 s (provisional); fidgeting with a coin or a ball.
   */
  export const roll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["regrasp"]["roll"]
  > = HumanActionRow("roll", regrasp, { kind: "roll" });
}
