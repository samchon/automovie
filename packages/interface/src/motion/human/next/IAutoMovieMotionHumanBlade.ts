import type { IAutoMovieMotionHumanLanceCouch } from "../lexicon/IAutoMovieMotionHumanLanceCouch";
import type { IAutoMovieMotionHumanSabre } from "../lexicon/IAutoMovieMotionHumanSabre";
import type { IAutoMovieMotionHumanSword } from "../lexicon/IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "../lexicon/IAutoMovieMotionHumanSwordGuard";
import type { IAutoMovieMotionHumanSwordParry } from "../lexicon/IAutoMovieMotionHumanSwordParry";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Fighting with a blade: the sword guard, the cut, thrust, parry and taken laws, the sabre and the couched lance.
 *
 * Every attack keeps the blade timing of `IAutoMovieMotionHumanSword`: a thrust reaches contact on a point speed of 2.6 m/s at novice to 3.2 m/s at elite and a cut on an edge speed of 6 to 10 m/s, a path of 0.8 m taking 0.47 s at elite for a thrust. A bind holds the parry for a second (provisional); a footwork step takes one stance step, 0.35 s at the reference hip. The composition gives the held blade (`blade`, a sword prop the hand picked up) and the target; with neither, the law is a solo drill of the bare hand.
 *
 * The presets are the constants of `AutoMovieMotionHumanBlade` that the film rows of `HumanBlade` and `HumanWeaponMelee` read: the footwork steps (`ADVANCE`, `RETREAT`, `TRAVERSE`, `VOID_STEP`), the parry holds (`BEAT`, `BIND`), the feint (`FEINT`), the club blows (`CLUB_SWING`, `CLUB_STRIKE`) and the reload (`RELOAD`).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared blade timing, what the composition gives and the preset constants.
 * @evidence contracts/development/design.md#principled-representation One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's laws and presets and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.
 */
export interface IAutoMovieMotionHumanBlade<Chain> {
  /**
   * The guards of blade work: the blade taken from where the hand holds it to a named guard and kept there.
   *
   * @param params The `guard` and `seconds` of `IAutoMovieMotionHumanSwordGuard.IParams`, with those of `IAutoMovieMotionHumanSword.IWield`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  swordGuard(
    params: IAutoMovieMotionHumanSwordGuard.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A cut of the blade from a named line, the edge brought through the target.
   *
   * @param params The `from` line and the members of `IAutoMovieMotionHumanSword.ICut`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  cut(params: IAutoMovieMotionHumanSword.ICut, anchor?: string): Chain;

  /**
   * A thrust of the blade point at the target, with the advance the target needs.
   *
   * @param params The `advance` and the members of `IAutoMovieMotionHumanSword.IAttack`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  thrust(params: IAutoMovieMotionHumanSword.IAttack, anchor?: string): Chain;

  /**
   * A parry that stops the opponent's attack on the blade, optionally held as a bind.
   *
   * @param params The `hold` and the members of `IAutoMovieMotionHumanSwordParry.IParry`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  parry(params: IAutoMovieMotionHumanSwordParry.IParry, anchor?: string): Chain;

  /**
   * The attacker's blade carried aside on the defender's bind after a parried attack.
   *
   * @param params The members of `IAutoMovieMotionHumanSwordParry.ITaken`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  taken(params: IAutoMovieMotionHumanSwordParry.ITaken, anchor?: string): Chain;

  /**
   * A mounted sabre carried on a slope or engaged with a target.
   *
   * @param params The members of `IAutoMovieMotionHumanSabre`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  sabre(params: IAutoMovieMotionHumanSabre, anchor?: string): Chain;

  /**
   * A lance lowered to the couched position at a target.
   *
   * @param params The members of `IAutoMovieMotionHumanLanceCouch`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  lanceCouch(params: IAutoMovieMotionHumanLanceCouch, anchor?: string): Chain;
}

/**
 * The parameter and preset types of the family's methods.
 */
export namespace IAutoMovieMotionHumanBlade {
  /**
   * The direction and step count a footwork preset fixes (`ADVANCE`, `RETREAT`, `TRAVERSE`, `VOID_STEP`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanStep.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanStep.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStep.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IFootworkPreset = Pick<
    IAutoMovieMotionHumanStep.IParams,
    "direction" | "steps"
  >;

  /**
   * The hold, in seconds, a parry preset fixes (`BEAT`, `BIND`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanSwordParry.IParry` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanSwordParry.IParry` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSwordParry.IParry` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IHoldPreset = Pick<
    IAutoMovieMotionHumanSwordParry.IParry,
    "hold"
  >;

  /**
   * The share of the cut a feint preset delivers before it is withdrawn (`FEINT`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanSword.ICut` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanSword.ICut` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSword.ICut` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IFeintPreset = Pick<IAutoMovieMotionHumanSword.ICut, "feint">;

  /**
   * The line and striking tip a club blow preset fixes (`CLUB_SWING`, `CLUB_STRIKE`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanSword.ICut` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanSword.ICut` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSword.ICut` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IClubPreset = Pick<
    IAutoMovieMotionHumanSword.ICut,
    "from" | "tip"
  >;

  /**
   * The touch the reload preset fixes: the support hand's palm pressed once (`RELOAD`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IReloadPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hand"
  >;
}
