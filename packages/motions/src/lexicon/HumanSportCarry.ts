import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { carryHang } from "../handling/carryHang";
import { pushSled } from "../handling/pushSled";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Loaded carries of strength training, each a row of a shipped law that carries
 * what the hands took before it: the held props ride the hands through the row
 * (`HumanSegment`'s carry). Register the rows a film uses.
 */
export namespace HumanSportCarry {
  /**
   * A farmer's walk: a slow walk with the arms still, carrying what both hands
   * took before it (a kettlebell or a dumbbell in each), so the arms hang and
   * do not swing (provisional: no arm swing, as a loaded carry is taught). The
   * composition gives where to. The `slow` walk's speed, about 0.82 m/s at the
   * reference hip ({@link IAutoMovieMotionHumanWalkParams.pace}).
   */
  export const farmersWalk: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportCarry"]["farmersWalk"]
  > = HumanActionRow("farmersWalk", walk, {
    pace: "slow",
    armSwing: 0,
  });

  /**
   * The loads of a farmer's walk held at the sides with the arms hanging,
   * performed over `farmersWalk`: the composition names the prop in each hand
   * and how long.
   */
  export const farmersHold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportCarry"]["farmersHold"]
  > = HumanActionRow("farmersHold", carryHang, {});

  /**
   * A sled push: the handles of a pushed load held in both hands through a slow
   * walk, the trunk leaning as measured pushers do at the handles' height
   * (`pushSledStance`). The composition gives the sled and where to.
   */
  export const sledPush: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportCarry"]["sledPush"]
  > = HumanActionRow("sledPush", pushSled, {});
}
