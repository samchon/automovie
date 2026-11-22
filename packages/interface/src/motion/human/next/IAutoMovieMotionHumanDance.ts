import type { IAutoMovieMotionHumanBallet } from "../exercise/IAutoMovieMotionHumanBallet";
import type { IAutoMovieMotionHumanDance as ILegacyDance } from "../exercise/IAutoMovieMotionHumanDance";
import type { IAutoMovieMotionHumanGroupDance } from "../exercise/IAutoMovieMotionHumanGroupDance";
import type { IAutoMovieMotionHumanStreetDance } from "../exercise/IAutoMovieMotionHumanStreetDance";
import type { IAutoMovieMotionHumanTapDance } from "../exercise/IAutoMovieMotionHumanTapDance";

/**
 * Mechanism: Footwork and body movement on a beat: social, ballet, tap, street and group dance. A beat count at a tempo gives the duration; dance styles share one 120 bpm clock.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Dance family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Dance laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanDance<Chain> {
  /**
   * A solo dance step locked to a declared beat (#3253, M23): the bounce, the side-to-side sway, the step-touch and the box step.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDance.dance: A solo dance step locked to a declared beat (#3253, M23): the bounce, the side-to-side sway, the step-touch and the box step.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDance.dance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDance.dance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDance.dance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDance.dance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDance.dance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDance.dance is provided by the chain that implements IAutoMovieMotionHumanDance.
   */
  dance(params: IAutoMovieMotionHumanDance.IDance, anchor?: string): Chain;

  /**
   * Classical ballet on the beat clock (#3991): the five positions of the feet with a plié or a relevé, the pirouette from fourth on demi-pointe en dehors or en dedans, and the grand jeté with its split at the flight's apex.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDance.ballet: Classical ballet on the beat clock (#3991): the five positions of the feet with a plié or a relevé, the pirouette from fourth on demi-pointe en dehors or en dedans, and the grand jeté with its split at the flight's apex.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDance.ballet is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDance.ballet is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDance.ballet is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDance.ballet is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDance.ballet is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDance.ballet is provided by the chain that implements IAutoMovieMotionHumanDance.
   */
  ballet(params: IAutoMovieMotionHumanDance.IBallet, anchor?: string): Chain;

  /**
   * Tap dance on the beat clock (#3991): the shuffle, the flap, the ball change, the heel drop, the cramp roll and a single time step.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDance.tapDance: Tap dance on the beat clock (#3991): the shuffle, the flap, the ball change, the heel drop, the cramp roll and a single time step.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDance.tapDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDance.tapDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDance.tapDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDance.tapDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDance.tapDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDance.tapDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   */
  tapDance(params: IAutoMovieMotionHumanDance.ITapDance, anchor?: string): Chain;

  /**
   * Street grooves on the beat clock (#4010): the rock, a bounce of the knees with the chest and the head isolating side to side and popping hits that stop sharp on their beat subdivisions; and the moonwa.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDance.streetDance: Street grooves on the beat clock (#4010): the rock, a bounce of the knees with the chest and the head isolating side to side and popping hits that stop sharp on their beat subdivisions; and the moonwa.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDance.streetDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDance.streetDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDance.streetDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDance.streetDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDance.streetDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDance.streetDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   */
  streetDance(params: IAutoMovieMotionHumanDance.IStreetDance, anchor?: string): Chain;

  /**
   * Social group dances on one shared beat (#4010), each member dancing the same steps relative to the group: - line: a grapevine to the right and back to the left, the last count turning a quarter to the left, so every repeat faces the next wall and the rows keep their spacing; - circle: members spaced evenly round a centre, hands joined with their neighbours, side-stepping round the centre so the circle rotates; - conga: members in file, each with both hands on the shoulders of the one ahead, stepping three counts forward and kicking on the fourth.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDance.groupDance: Social group dances on one shared beat (#4010), each member dancing the same steps relative to the group: - line: a grapevine to the right and back to the left, the last count turning a quarter to the left, so every repeat faces the next wall and the rows keep their spacing; - circle: members spaced evenly round a centre, hands joined with their neighbours, side-stepping round the centre so the circle rotates; - conga: members in file, each with both hands on the shoulders of the one ahead, stepping three counts forward and kicking on the fourth.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDance.groupDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDance.groupDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDance.groupDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDance.groupDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDance.groupDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDance.groupDance is provided by the chain that implements IAutoMovieMotionHumanDance.
   */
  groupDance(params: IAutoMovieMotionHumanDance.IGroupDance, anchor?: string): Chain;
}

/**
 * The parameter types of the Dance methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Dance method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanDance {
  /** The parameters of `dance`. */
  export type IDance = ILegacyDance.IParams;

  /** The parameters of `ballet`. */
  export type IBallet = IAutoMovieMotionHumanBallet.IParams;

  /** The parameters of `tapDance`. */
  export type ITapDance = IAutoMovieMotionHumanTapDance.IParams;

  /** The parameters of `streetDance`. */
  export type IStreetDance = IAutoMovieMotionHumanStreetDance.IParams;

  /** The parameters of `groupDance`. */
  export type IGroupDance = IAutoMovieMotionHumanGroupDance.IParams;
}
