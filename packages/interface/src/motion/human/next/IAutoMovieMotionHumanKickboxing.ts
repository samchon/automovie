import type { IAutoMovieMotionHumanKickboxingRing } from "../sport/kickboxing/IAutoMovieMotionHumanKickboxingRing";
import type { IAutoMovieMotionHumanDefence } from "./IAutoMovieMotionHumanDefence";
import type { IAutoMovieMotionHumanStrike } from "./IAutoMovieMotionHumanStrike";

/**
 * A kickboxing bout: the Strike and Defence families' actions, whose timing they own, in the fighting stance (`IAutoMovieMotionHumanStrikingStance`) inside a ring, under the GLORY rules. The ring, the rules and the knockdown count are data on `AutoMovieMotionHumanKickboxing` (`KickboxingRing`, `KickboxingRules`, `KnockdownCount`); the bout adds no method of its own. No fighting distance in metres, no combination rhythm by skill and no champion speed is defined yet (provisional, to be added from sources).
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

/**
 * The ring a bout is fought in and its corners.
 */
export namespace IAutoMovieMotionHumanKickboxing {
  /**
   * The ring a bout is fought in: `IAutoMovieMotionHumanKickboxingRing.IRing`, a square ring's centre in world metres, its side between the ropes in metres and its heading in degrees about +Y.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the aliased ring type and the ring's centre, side and heading with their frame and units.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKickboxingRing.IRing`: the frame, the units and the positive side left to the ring queries are that type's; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKickboxingRing.IRing` owns the shape. The family's runtime namespace groups `KickboxingRing`, whose queries read a ring, so the family namespace names the type; no method of this interface takes it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRing = IAutoMovieMotionHumanKickboxingRing.IRing;

  /**
   * A ring corner's name: `IAutoMovieMotionHumanKickboxingRing.Corner`, `red`, `blue`, `neutralA` or `neutralB`, the red and blue corners on one diagonal and the neutral ones on the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the aliased corner type, its four values and their diagonals.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKickboxingRing.Corner`, a closed union of the four corners, so no other corner name type-checks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKickboxingRing.Corner` owns the union. The corner query of `KickboxingRing` and `KnockdownCount`, grouped in the family's runtime namespace, name corners by it; no method of this interface takes it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICorner = IAutoMovieMotionHumanKickboxingRing.Corner;
}
