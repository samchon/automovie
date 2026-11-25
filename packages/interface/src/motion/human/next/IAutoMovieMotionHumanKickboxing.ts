import type { IAutoMovieMotionHumanDefence } from "./IAutoMovieMotionHumanDefence";
import type { IAutoMovieMotionHumanStrike } from "./IAutoMovieMotionHumanStrike";

/**
 * A kickboxing bout: the Strike and Defence families' actions, whose timing
 * they own, in the fighting stance (`IAutoMovieMotionHumanStrikingStance`)
 * inside a ring, under the GLORY rules. The ring, the rules and the knockdown
 * count are data on `AutoMovieMotionHumanKickboxing` (`Ring`, `Rules`,
 * `KnockdownCount`); the bout adds no method of its own. The fighting distance
 * is the `fighting` band of `HumanProxemics` (1.5 m, Gait family); no
 * combination rhythm by skill and no champion speed is defined yet
 * (provisional, to be added from sources).
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanKickboxing<Chain>
  extends
    IAutoMovieMotionHumanStrike<Chain>,
    IAutoMovieMotionHumanDefence<Chain> {}
