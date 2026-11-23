import type { IAutoMovieMotionHumanStand } from "../actions/IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanCurtsy } from "../everyday/IAutoMovieMotionHumanCurtsy";
import type { IAutoMovieMotionHumanRest } from "../everyday/IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanShift } from "../everyday/IAutoMovieMotionHumanShift";

/**
 * The standing postures: quiet standing, shifting weight, bending, crouching, bracing, resting and curtsying.
 *
 * A planted posture computes no balance. A named rest or hold that fixes parameter values is a preset, data spread into the law's parameters beside the hold: `AutoMovieMotionHumanStance.ARMS_CROSSED`, `HANDS_ON_HIPS`, `HANDS_IN_POCKETS`, `PARADE_REST`, `HANDS_CLASPED`, `HANDS_BEHIND_HEAD` and `THINKING`, `REST_SIDE`, `CHIN_REST` and `ELBOW_SUPPORT` (`IRestPreset`), `SQUAT_SIT` and `TAKE_COVER` (`ICrouchPreset`) and `MOUNTAIN_POSE` (`IStandPreset`); a preset adds no method.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Stance family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Stance laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanStance<Chain> {
  /**
   * Quiet standing: both feet planted where they are (or under the hips when entered from the air), the pelvis settling over them, the column upright on the plumb line and inclined slightly forward at the ankles (`standUpright`), arms hanging relaxed, and the body swaying slightly.
   *
   * @param params The `seconds`, `sway` and `on` of `IAutoMovieMotionHumanStand.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  stand(params: IAutoMovieMotionHumanStand.IParams, anchor?: string): Chain;

  /**
   * Shifting along a bench while seated: the seat socket slides sideways along the seat by the requested distance, while the feet stay planted and the hands stay on the thighs.
   *
   * @param params The `by` and `seconds` of `IAutoMovieMotionHumanShift.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  shift(params: IAutoMovieMotionHumanShift.IParams, anchor?: string): Chain;

  /**
   * Bending down to bring a hand to a low point (the floor, a low shelf, a note on the ground) with the feet planted, by a stoop, a squat or a semi-squat, then straightening up.
   *
   * @param params The `balance`, `toward`, `side`, `strategy` and `hold` of `IAutoMovieMotionHumanBend.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  bend(params: IAutoMovieMotionHumanBend.IParams, anchor?: string): Chain;

  /**
   * A crouch or a squat held in place: the hips sink over the planted feet to a knee flexion the depth names, the trunk inclines until the centre of mass is back over the feet, the hands come to rest on the thighs above the knees, the body holds, then stands again.
   *
   * @param params The `balance`, `depth`, `heels`, `hold` and `manner` of `IAutoMovieMotionHumanCrouch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  crouch(params: IAutoMovieMotionHumanCrouch.IParams, anchor?: string): Chain;

  /**
   * Bracing for an expected impact, push or a falling body: the stance widens and staggers along the line of the coming force, the body lowers and leans into it, and the hands come up in front, all set before the force arrives.
   *
   * @param params The `balance`, `toward`, `kind` and `seconds` of `IAutoMovieMotionHumanBrace.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  brace(params: IAutoMovieMotionHumanBrace.IParams, anchor?: string): Chain;

  /**
   * Standing with the hands at rest places: in the front pockets, on the hips, arms crossed, clasped in front or behind, behind the head, or the chin on a fist, each hand moved there and held.
   *
   * @param params The `left`, `right` and `seconds` of `IAutoMovieMotionHumanRest.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  rest(params: IAutoMovieMotionHumanRest.IParams, anchor?: string): Chain;

  /**
   * One standing curtsy: a cross behind the supporting leg, a dip, and a return to the original stance, admitted against the performer's available planted reach.
   *
   * @param params The `side`, `depth` and `duration` of `IAutoMovieMotionHumanCurtsy`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.curtsy is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.curtsy is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.curtsy is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.curtsy is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.curtsy is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.curtsy is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  curtsy(params: IAutoMovieMotionHumanCurtsy, anchor?: string): Chain;
}

/**
 * The parameter types of the Stance methods.
 */
export namespace IAutoMovieMotionHumanStance {
  /**
   * The places of both hands that a named rest fixes: the `left` and `right` of `rest`. Spread into `rest`'s parameters with the hold; the preset constants of `AutoMovieMotionHumanStance` (`ARMS_CROSSED`, `HANDS_ON_HIPS`, `HANDS_IN_POCKETS`, `PARADE_REST`, `HANDS_CLASPED`, `HANDS_BEHIND_HEAD` and `THINKING`) are its data and the rows of the same names read them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it, how it is applied and where the places' meanings are.
   * @evidence contracts/development/design.md#principled-representation The rest law's own `left` and `right` members, so a preset fixes exactly the two places and the law keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `rest` owns the places' meanings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type names the pick of `rest`'s own members and redefines none.
   */
  export type IRestPreset = Pick<
    IAutoMovieMotionHumanRest.IParams,
    "left" | "right"
  >;

  /**
   * The hold that a named stand fixes: the `hold` of `stand`, in seconds. Spread into `stand`'s parameters; `AutoMovieMotionHumanStance.MOUNTAIN_POSE` is its data and the `mountainPose` row reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which preset uses it, how it is applied and where the member's meaning is.
   * @evidence contracts/development/design.md#principled-representation The stand law's own `hold` member, so a preset fixes exactly the hold and the law keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `stand` owns the hold's meaning.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type names the pick of `stand`'s own member and redefines none.
   */
  export type IStandPreset = Pick<IAutoMovieMotionHumanStand.IParams, "hold">;

  /**
   * The depth, heel position and hold that a named crouch fixes: the `depth`, `heels` and `hold` of `crouch`. Spread into `crouch`'s parameters; `AutoMovieMotionHumanStance.SQUAT_SIT` and `TAKE_COVER` are its data and the rows of the same names read them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it, how it is applied and where the members' meanings are.
   * @evidence contracts/development/design.md#principled-representation The crouch law's own members, so a preset fixes only the values its row means and the law keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `crouch` owns the members' meanings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type names the pick of `crouch`'s own members and redefines none.
   */
  export type ICrouchPreset = Pick<
    IAutoMovieMotionHumanCrouch.IParams,
    "depth" | "heels" | "hold"
  >;
}
