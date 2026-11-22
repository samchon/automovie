import type { IAutoMovieMotionHumanArmWrestle } from "../touch/IAutoMovieMotionHumanArmWrestle";
import type { IAutoMovieMotionHumanHighFive } from "../touch/IAutoMovieMotionHumanHighFive";
import type { IAutoMovieMotionHumanKiss } from "../touch/IAutoMovieMotionHumanKiss";
import type { IAutoMovieMotionHumanLegTouch } from "../touch/IAutoMovieMotionHumanLegTouch";
import type { IAutoMovieMotionHumanTouch as ILegacyTouch } from "../touch/IAutoMovieMotionHumanTouch";

/**
 * Mechanism: Touching a partner: a touch, a high five, a kiss, a leg touch and arm wrestling.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Touch family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Touch laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanTouch<Chain> {
  /**
   * A touch while standing: one hand, or both, laid on a region of a partner or of the performer's own body and moved on it by a kind of social touch (Jung et al.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanTouch.touch: A touch while standing: one hand, or both, laid on a region of a partner or of the performer's own body and moved on it by a kind of social touch (Jung et al.
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanTouch.highFive: A high five, a low five or a fist bump between two standing partners: both bring one hand to one shared point between them and meet there at one shared instant (#3284), the mutual goal the handshake uses (`AutoMovieMotionMeeting`).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  highFive(params: IAutoMovieMotionHumanTouch.IHighFive, anchor?: string): Chain;

  /**
   * A kiss while standing: the lips brought to a partner's region (a cheek, the forehead, the crown, the lips, the back of a hand) by leaning the body from the hips and flexing the neck, the head turned to one side for a cheek or the lips so the noses stay clear (#3284).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanTouch.kiss: A kiss while standing: the lips brought to a partner's region (a cheek, the forehead, the crown, the lips, the back of a hand) by leaning the body from the hips and flexing the neck, the head turned to one side for a cheek or the lips so the noses stay clear (#3284).
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanTouch.legTouch: A touch with the leg while standing (#3357's effectors below the hip): the toes, the heel or the knee of one leg is brought onto a place and held there, the other leg bearing the body.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  legTouch(params: IAutoMovieMotionHumanTouch.ILegTouch, anchor?: string): Chain;

  /**
   * Arm wrestling, one role of it (#3350): the elbow planted on a table's top, the hand clasped with the partner's above it, the struggle and the pin.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanTouch.armWrestle: Arm wrestling, one role of it (#3350): the elbow planted on a table's top, the hand clasped with the partner's above it, the struggle and the pin.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.armWrestle is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.armWrestle is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.armWrestle is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.armWrestle is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.armWrestle is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.armWrestle is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  armWrestle(params: IAutoMovieMotionHumanTouch.IArmWrestle, anchor?: string): Chain;
}

/**
 * The parameter types of the Touch methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Touch method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanTouch {
  /** The parameters of `touch`. */
  export type ITouch = ILegacyTouch.IParams;

  /** The parameters of `highFive`. */
  export type IHighFive = IAutoMovieMotionHumanHighFive.IParams;

  /** The parameters of `kiss`. */
  export type IKiss = IAutoMovieMotionHumanKiss.IParams;

  /** The parameters of `legTouch`. */
  export type ILegTouch = IAutoMovieMotionHumanLegTouch.IParams;

  /** The parameters of `armWrestle`. */
  export type IArmWrestle = IAutoMovieMotionHumanArmWrestle.IParams;
}
