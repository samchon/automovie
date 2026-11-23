import type { IAutoMovieMotionHumanDefence } from "./IAutoMovieMotionHumanDefence";
import type { IAutoMovieMotionHumanStrike } from "./IAutoMovieMotionHumanStrike";

/**
 * A kickboxing bout: the Strike and Defence families' actions, whose timing they own, in the fighting stance (`IAutoMovieMotionHumanStrikingStance`) inside a ring, under the GLORY rules. The ring, the rules and the knockdown count are data on `AutoMovieMotionHumanKickboxing` (`Ring`, `Rules`, `KnockdownCount`); the bout adds no method of its own. No fighting distance in metres, no combination rhythm by skill and no champion speed is defined yet (provisional, to be added from sources).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the families a bout acts with, where their timing is owned, the bout's data and what is not yet defined.
 * @evidence contracts/development/design.md#principled-representation The bout's vocabulary is the Strike and Defence interfaces, extended rather than redeclared, so each law keeps one method.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The ring and corner types and the runtime data; no method the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no strike or defence method is declared a second time.
 */
export interface IAutoMovieMotionHumanKickboxing<Chain>
  extends
    IAutoMovieMotionHumanStrike<Chain>,
    IAutoMovieMotionHumanDefence<Chain> {}
