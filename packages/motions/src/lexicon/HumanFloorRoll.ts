import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { roll } from "../floor/internal/roll";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";

/**
 * Rolls on the floor, each a row of the roll law. Register the rows a film
 * uses.
 */
export namespace HumanFloorRoll {
  /**
   * A forward roll: crouch, roll over the back forward, rise on the feet.
   * Crouches over 0.7 s, turns over 1.1 s and rises over 0.7 s (`roll.CROUCH`,
   * `roll.TURN`, provisional): 2.5 s.
   */
  export const forwardRoll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["floorRoll"]["forwardRoll"]
  > = AutoMovieMotionHumanActionRow.of("forwardRoll", roll, {
    direction: "forward",
  });

  /**
   * A backward roll: crouch, roll over the back backward, rise on the feet.
   * Crouches over 0.7 s, turns over 1.1 s and rises over 0.7 s (`roll.CROUCH`,
   * `roll.TURN`, provisional): 2.5 s.
   */
  export const backwardRoll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["floorRoll"]["backwardRoll"]
  > = AutoMovieMotionHumanActionRow.of("backwardRoll", roll, {
    direction: "backward",
  });
}
