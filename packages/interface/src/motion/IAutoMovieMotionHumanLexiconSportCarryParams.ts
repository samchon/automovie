import type { IAutoMovieMotionHumanWalkParams } from "./IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanCarryHang } from "./IAutoMovieMotionHumanCarryHang";
import type { IAutoMovieMotionHumanPushSled } from "./IAutoMovieMotionHumanPushSled";

/**
 * Open parameters of the sportCarry lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconSportCarryParams {
  /**
   * A farmer's walk: a slow walk with the arms still, carrying what both hands
   * took before it (a kettlebell or a dumbbell in each), so the arms hang and
   * do not swing (provisional: no arm swing, as a loaded carry is taught). The
   * composition gives where to.
   */
  farmersWalk: Omit<IAutoMovieMotionHumanWalkParams, "pace" | "armSwing">;

  /**
   * The loads of a farmer's walk held at the sides with the arms hanging,
   * performed over `farmersWalk`: the composition names the prop in each hand
   * and how long.
   */
  farmersHold: IAutoMovieMotionHumanCarryHang.IParams;

  /**
   * A sled push: the handles of a pushed load held in both hands through a slow
   * walk, the trunk leaning as measured pushers do at the handles' height
   * (`pushSledStance`). The composition gives the sled and where to.
   */
  sledPush: IAutoMovieMotionHumanPushSled.IParams;
}
