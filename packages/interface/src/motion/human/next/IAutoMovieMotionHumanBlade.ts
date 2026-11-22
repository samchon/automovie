import type { IAutoMovieMotionHumanLanceCouch } from "../lexicon/IAutoMovieMotionHumanLanceCouch";
import type { IAutoMovieMotionHumanSabre } from "../lexicon/IAutoMovieMotionHumanSabre";
import type { IAutoMovieMotionHumanSword } from "../lexicon/IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "../lexicon/IAutoMovieMotionHumanSwordGuard";
import type { IAutoMovieMotionHumanSwordParry } from "../lexicon/IAutoMovieMotionHumanSwordParry";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";

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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  swordGuard(
    params: IAutoMovieMotionHumanBlade.ISwordGuard,
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.cut is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.cut is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.cut is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.cut is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.cut is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.cut is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  cut(params: IAutoMovieMotionHumanBlade.ICut, anchor?: string): Chain;

  /**
   * A thrust of the blade point at the target, with the advance the target needs.
   *
   * @param params The `advance` and the members of `IAutoMovieMotionHumanSword.IAttack`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.thrust is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.thrust is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.thrust is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.thrust is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.thrust is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.thrust is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  thrust(params: IAutoMovieMotionHumanBlade.IThrust, anchor?: string): Chain;

  /**
   * A parry that stops the opponent's attack on the blade, optionally held as a bind.
   *
   * @param params The `hold` and the members of `IAutoMovieMotionHumanSwordParry.IParry`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.parry is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.parry is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.parry is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.parry is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.parry is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.parry is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  parry(params: IAutoMovieMotionHumanBlade.IParry, anchor?: string): Chain;

  /**
   * The attacker's blade carried aside on the defender's bind after a parried attack.
   *
   * @param params The members of `IAutoMovieMotionHumanSwordParry.ITaken`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.taken is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.taken is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.taken is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.taken is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.taken is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.taken is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  taken(params: IAutoMovieMotionHumanBlade.ITaken, anchor?: string): Chain;

  /**
   * A mounted sabre carried on a slope or engaged with a target.
   *
   * @param params The members of `IAutoMovieMotionHumanSabre`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.sabre is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.sabre is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.sabre is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.sabre is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.sabre is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.sabre is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  sabre(params: IAutoMovieMotionHumanBlade.ISabre, anchor?: string): Chain;

  /**
   * A lance lowered to the couched position at a target.
   *
   * @param params The members of `IAutoMovieMotionHumanLanceCouch`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.lanceCouch is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.lanceCouch is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.lanceCouch is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.lanceCouch is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.lanceCouch is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.lanceCouch is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  lanceCouch(
    params: IAutoMovieMotionHumanBlade.ILanceCouch,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter and preset types of the family's methods.
 */
export namespace IAutoMovieMotionHumanBlade {
  /**
   * The parameters of `swordGuard`: the law's own `IAutoMovieMotionHumanSwordGuard.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSwordGuard` owns the type; the alias serves this family's `swordGuard` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `swordGuard` takes the type its law reads.
   */
  export type ISwordGuard = IAutoMovieMotionHumanSwordGuard.IParams;

  /**
   * The parameters of `cut`: the law's own `IAutoMovieMotionHumanSword.ICut`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSword` owns the type; the alias serves this family's `cut` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `cut` takes the type its law reads.
   */
  export type ICut = IAutoMovieMotionHumanSword.ICut;

  /**
   * The parameters of `thrust`: the law's own `IAutoMovieMotionHumanSword.IAttack`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSword` owns the type; the alias serves this family's `thrust` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `thrust` takes the type its law reads.
   */
  export type IThrust = IAutoMovieMotionHumanSword.IAttack;

  /**
   * The parameters of `parry`: the law's own `IAutoMovieMotionHumanSwordParry.IParry`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSwordParry` owns the type; the alias serves this family's `parry` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `parry` takes the type its law reads.
   */
  export type IParry = IAutoMovieMotionHumanSwordParry.IParry;

  /**
   * The parameters of `taken`: the law's own `IAutoMovieMotionHumanSwordParry.ITaken`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSwordParry` owns the type; the alias serves this family's `taken` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `taken` takes the type its law reads.
   */
  export type ITaken = IAutoMovieMotionHumanSwordParry.ITaken;

  /**
   * The parameters of `sabre`: the law's own `IAutoMovieMotionHumanSabre`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSabre` owns the type; the alias serves this family's `sabre` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `sabre` takes the type its law reads.
   */
  export type ISabre = IAutoMovieMotionHumanSabre;

  /**
   * The parameters of `lanceCouch`: the law's own `IAutoMovieMotionHumanLanceCouch`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLanceCouch` owns the type; the alias serves this family's `lanceCouch` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `lanceCouch` takes the type its law reads.
   */
  export type ILanceCouch = IAutoMovieMotionHumanLanceCouch;

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
