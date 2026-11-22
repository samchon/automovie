import type { IAutoMovieMotionHumanHighFive } from "../touch/IAutoMovieMotionHumanHighFive";
import type { IAutoMovieMotionHumanKiss } from "../touch/IAutoMovieMotionHumanKiss";
import type { IAutoMovieMotionHumanLegTouch } from "../touch/IAutoMovieMotionHumanLegTouch";
import type { IAutoMovieMotionHumanTouch as ILegacyTouch } from "../touch/IAutoMovieMotionHumanTouch";

/**
 * Touching a partner: a touch, a high five, a kiss and a leg touch.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Touch family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Touch laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanTouch<Chain> {
  /**
   * A touch while standing: one hand, or both, laid on a region of a partner or of the performer's own body and moved on it by a kind of social touch; the kinds and their source are on `IAutoMovieMotionHumanTouch`.
   *
   * @param params The `balance`, `target`, `kind`, `with`, `side`, `site`, `prop`, `point`, `grasp`, `clear`, `elbow`, `arms`, `other`, `rests`, `count`, `hold`, `tangent` and `manner` of `ILegacyTouch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  touch(params: IAutoMovieMotionHumanTouch.ITouch, anchor?: string): Chain;

  /**
   * A high five, a low five or a fist bump between two standing partners: both bring one hand to one shared point between them and meet there at one shared instant (#3284), the mutual goal the handshake uses (`AutoMovieMotionMeeting`).
   *
   * @param params The `partner`, `kind`, `side`, `prop`, `point`, `window` and `at` of `IAutoMovieMotionHumanHighFive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  highFive(
    params: IAutoMovieMotionHumanTouch.IHighFive,
    anchor?: string,
  ): Chain;

  /**
   * A kiss while standing: the lips brought to a partner's region (a cheek, the forehead, the crown, the lips, the back of a hand) by leaning the body from the hips and flexing the neck, the head turned to one side for a cheek or the lips so the noses stay clear (#3284).
   *
   * @param params The `partner`, `region`, `handRole`, `side`, `hold` and `manner` of `IAutoMovieMotionHumanKiss.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  kiss(params: IAutoMovieMotionHumanTouch.IKiss, anchor?: string): Chain;

  /**
   * A touch with the leg while standing (#3357's effectors below the hip): the toes, the heel or the knee of one leg is brought onto a place and held there, the other leg bearing the body.
   *
   * @param params The `balance`, `target`, `with`, `side` and `hold` of `IAutoMovieMotionHumanLegTouch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  legTouch(
    params: IAutoMovieMotionHumanTouch.ILegTouch,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Touch methods.
 */
export namespace IAutoMovieMotionHumanTouch {
  /**
   * The parameters of `touch`: `IAutoMovieMotionHumanTouch.IParams` (`touch/IAutoMovieMotionHumanTouch`), the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanTouch.IParams` (`touch/IAutoMovieMotionHumanTouch`): the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` (`touch/IAutoMovieMotionHumanTouch`) owns the shape; the alias serves `touch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ITouch = ILegacyTouch.IParams;

  /**
   * The parameters of `highFive`: `IAutoMovieMotionHumanHighFive.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHighFive.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHighFive.IParams` owns the shape; the alias serves `highFive` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IHighFive = IAutoMovieMotionHumanHighFive.IParams;

  /**
   * The parameters of `kiss`: `IAutoMovieMotionHumanKiss.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKiss.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKiss.IParams` owns the shape; the alias serves `kiss` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IKiss = IAutoMovieMotionHumanKiss.IParams;

  /**
   * The parameters of `legTouch`: `IAutoMovieMotionHumanLegTouch.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanLegTouch.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLegTouch.IParams` owns the shape; the alias serves `legTouch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ILegTouch = IAutoMovieMotionHumanLegTouch.IParams;
}
