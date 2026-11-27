import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { dive } from "../../floor/internal/dive";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_FALL_GOALKEEPER_DIVE_LEFT } from "../../next/presets/HUMAN_FALL_GOALKEEPER_DIVE_LEFT";
import { HUMAN_FALL_GOALKEEPER_DIVE_RIGHT } from "../../next/presets/HUMAN_FALL_GOALKEEPER_DIVE_RIGHT";

/**
 * Falls onto the floor on purpose, each a row of the dive law. Register the
 * rows a film uses.
 */
export namespace HumanFloorFall {
  /**
   * A goalkeeper's dive to the left: off the feet to the side, landing on the
   * side with the hip and the lower hand on the floor. Crouches 0.3 s, flies
   * 0.45 s and rests 0.6 s (1.35 s in all), the hips moving 0.8 statures to the
   * side (`dive.PHASES`, `dive.REACH`, provisional).
   */
  export const goalkeeperDiveLeft: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["floorFall"]["goalkeeperDiveLeft"]
  > = AutoMovieMotionHumanActionRow.of("goalkeeperDiveLeft", dive, {
    kind: "dive",
    ...HUMAN_FALL_GOALKEEPER_DIVE_LEFT,
  });

  /**
   * A goalkeeper's dive to the right. Crouches 0.3 s, flies 0.45 s and rests
   * 0.6 s (1.35 s in all), the hips moving 0.8 statures to the side
   * (`dive.PHASES`, `dive.REACH`, provisional).
   */
  export const goalkeeperDiveRight: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["floorFall"]["goalkeeperDiveRight"]
  > = AutoMovieMotionHumanActionRow.of("goalkeeperDiveRight", dive, {
    kind: "dive",
    ...HUMAN_FALL_GOALKEEPER_DIVE_RIGHT,
  });

  /**
   * A sliding tackle: leaning back onto the hip and sliding forward with the
   * lead leg reaching ahead. Crouches 0.2 s, slides 0.8 s and rests 0.5 s (1.5
   * s in all), the hips sliding 0.7 statures forward (`dive.PHASES`,
   * `dive.REACH`, provisional).
   */
  export const slidingTackle: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["floorFall"]["slidingTackle"]
  > = AutoMovieMotionHumanActionRow.of("slidingTackle", dive, {
    kind: "slide",
  });
}
