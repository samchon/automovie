import type { IAutoMovieMotionHumanStand } from "../actions/IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanRest } from "../everyday/IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanShift } from "../everyday/IAutoMovieMotionHumanShift";

/**
 * Mechanism: The standing postures: quiet standing, shifting weight, bending, crouching, bracing and resting.
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanStance.stand: Quiet standing: both feet planted where they are (or under the hips when entered from the air), the pelvis settling over them, the column upright on the plumb line and inclined slightly forward at the ankles (`standUpright`), arms hanging relaxed, and the body swaying slightly.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.stand is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  stand(params: IAutoMovieMotionHumanStance.IStand, anchor?: string): Chain;

  /**
   * Shifting along a bench while seated: the seat socket slides sideways along the seat by the requested distance, while the feet stay planted and the hands stay on the thighs.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanStance.shift: Shifting along a bench while seated: the seat socket slides sideways along the seat by the requested distance, while the feet stay planted and the hands stay on the thighs.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.shift is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  shift(params: IAutoMovieMotionHumanStance.IShift, anchor?: string): Chain;

  /**
   * Bending down to bring a hand to a low point (the floor, a low shelf, a note on the ground) with the feet planted, by a stoop, a squat or a semi-squat, then straightening up.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanStance.bend: Bending down to bring a hand to a low point (the floor, a low shelf, a note on the ground) with the feet planted, by a stoop, a squat or a semi-squat, then straightening up.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.bend is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  bend(params: IAutoMovieMotionHumanStance.IBend, anchor?: string): Chain;

  /**
   * A crouch or a squat held in place: the hips sink over the planted feet to a knee flexion the depth names, the trunk inclines until the centre of mass is back over the feet, the hands come to rest on the thighs above the knees, the body holds, then stands again.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanStance.crouch: A crouch or a squat held in place: the hips sink over the planted feet to a knee flexion the depth names, the trunk inclines until the centre of mass is back over the feet, the hands come to rest on the thighs above the knees, the body holds, then stands again.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.crouch is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  crouch(params: IAutoMovieMotionHumanStance.ICrouch, anchor?: string): Chain;

  /**
   * Bracing for an expected impact, push or a falling body: the stance widens and staggers along the line of the coming force, the body lowers and leans into it, and the hands come up in front, all set before the force arrives.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanStance.brace: Bracing for an expected impact, push or a falling body: the stance widens and staggers along the line of the coming force, the body lowers and leans into it, and the hands come up in front, all set before the force arrives.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.brace is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  brace(params: IAutoMovieMotionHumanStance.IBrace, anchor?: string): Chain;

  /**
   * Standing with the hands at rest places: in the front pockets, on the hips, arms crossed, clasped in front or behind, behind the head, or the chin on a fist, each hand moved there and held.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanStance.rest: Standing with the hands at rest places: in the front pockets, on the hips, arms crossed, clasped in front or behind, behind the head, or the chin on a fist, each hand moved there and held.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStance.rest is provided by the chain that implements IAutoMovieMotionHumanStance.
   */
  rest(params: IAutoMovieMotionHumanStance.IRest, anchor?: string): Chain;
}

/**
 * The parameter types of the Stance methods.
 */
export namespace IAutoMovieMotionHumanStance {
  /**
   * The parameters of `stand`: `IAutoMovieMotionHumanStand.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanStand.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStand.IParams` owns the shape; the alias serves `stand` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IStand = IAutoMovieMotionHumanStand.IParams;

  /**
   * The parameters of `shift`: `IAutoMovieMotionHumanShift.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanShift.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanShift.IParams` owns the shape; the alias serves `shift` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IShift = IAutoMovieMotionHumanShift.IParams;

  /**
   * The parameters of `bend`: `IAutoMovieMotionHumanBend.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBend.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBend.IParams` owns the shape; the alias serves `bend` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBend = IAutoMovieMotionHumanBend.IParams;

  /**
   * The parameters of `crouch`: `IAutoMovieMotionHumanCrouch.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanCrouch.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCrouch.IParams` owns the shape; the alias serves `crouch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICrouch = IAutoMovieMotionHumanCrouch.IParams;

  /**
   * The parameters of `brace`: `IAutoMovieMotionHumanBrace.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBrace.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBrace.IParams` owns the shape; the alias serves `brace` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBrace = IAutoMovieMotionHumanBrace.IParams;

  /**
   * The parameters of `rest`: `IAutoMovieMotionHumanRest.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRest.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRest.IParams` owns the shape; the alias serves `rest` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRest = IAutoMovieMotionHumanRest.IParams;
}
