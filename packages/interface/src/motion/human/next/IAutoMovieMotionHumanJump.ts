import type { IAutoMovieMotionHumanHighJump } from "../sport/IAutoMovieMotionHumanHighJump";
import type { IAutoMovieMotionHumanHorizontalJump } from "../sport/IAutoMovieMotionHumanHorizontalJump";
import type { IAutoMovieMotionHumanHurdleClear } from "../sport/IAutoMovieMotionHumanHurdleClear";
import type { IAutoMovieMotionHumanJump as ILegacyJump } from "../actions/IAutoMovieMotionHumanJump";
import type { IAutoMovieMotionHumanPoleVault } from "../sport/IAutoMovieMotionHumanPoleVault";

/**
 * Mechanism: The flight laws: a push-off, a flight under gravity and a landing. A flight lasts `sqrt(8 apex / g)` at gravity 9.80665 m/s2 for a level jump (`jump.plan`); push-off, absorption and rise are provisional and scale with `manner.pace`, and the flight does not.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Jump family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Jump laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanJump<Chain> {
  /**
   * A jump to a floor point: a push-off from a planted foot, a ballistic flight and a two-footed landing that absorbs and rises to standing.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanJump.jump: A jump to a floor point: a push-off from a planted foot, a ballistic flight and a two-footed landing that absorbs and rises to standing.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanJump.jump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanJump.jump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanJump.jump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanJump.jump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanJump.jump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanJump.jump is provided by the chain that implements IAutoMovieMotionHumanJump.
   */
  jump(params: IAutoMovieMotionHumanJump.IJump, anchor?: string): Chain;

  /**
   * A long jump out of a run (#3871): the run is cut at the take-off foot's footfall on the board, the jump's own push-off launches at a take-off angle of about 21 degrees (`horizontalJump.ANGLE`), the flight is ballistic, and both feet land in the sand with the heels at the authored distance from the take-off line, absorb and rise.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanJump.horizontalJump: A long jump out of a run (#3871): the run is cut at the take-off foot's footfall on the board, the jump's own push-off launches at a take-off angle of about 21 degrees (`horizontalJump.ANGLE`), the flight is ballistic, and both feet land in the sand with the heels at the authored distance from the take-off line, absorb and rise.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanJump.horizontalJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanJump.horizontalJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanJump.horizontalJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanJump.horizontalJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanJump.horizontalJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanJump.horizontalJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   */
  horizontalJump(params: IAutoMovieMotionHumanJump.IHorizontalJump, anchor?: string): Chain;

  /**
   * A high jump in the Fosbury flop (#3377): a one-foot take-off, a half turn that puts the back to the bar, a backward lay-out over it with the back arched, the legs lifted after the hips pass, and a landing on the back.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanJump.highJump: A high jump in the Fosbury flop (#3377): a one-foot take-off, a half turn that puts the back to the bar, a backward lay-out over it with the back arched, the legs lifted after the hips pass, and a landing on the back.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanJump.highJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanJump.highJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanJump.highJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanJump.highJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanJump.highJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanJump.highJump is provided by the chain that implements IAutoMovieMotionHumanJump.
   */
  highJump(params: IAutoMovieMotionHumanJump.IHighJump, anchor?: string): Chain;

  /**
   * A pole vault (#3377): out of a run, the hand that holds the pole plants its end on the floor ahead at the take-off, the body swings over the planted end with the pole, lets go as the pole stands upright, and flies on to come down lying on the landing surface.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanJump.poleVault: A pole vault (#3377): out of a run, the hand that holds the pole plants its end on the floor ahead at the take-off, the body swings over the planted end with the pole, lets go as the pole stands upright, and flies on to come down lying on the landing surface.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanJump.poleVault is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanJump.poleVault is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanJump.poleVault is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanJump.poleVault is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanJump.poleVault is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanJump.poleVault is provided by the chain that implements IAutoMovieMotionHumanJump.
   */
  poleVault(params: IAutoMovieMotionHumanJump.IPoleVault, anchor?: string): Chain;

  /**
   * A hurdle clearance out of a run (#3870): the run is cut at the take-off foot's footfall before the hurdle, that foot pushes off, the lead leg swings over the bar, the trail leg comes round over it, and the lead foot lands beyond, where a run may take the stride on.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanJump.hurdleClear: A hurdle clearance out of a run (#3870): the run is cut at the take-off foot's footfall before the hurdle, that foot pushes off, the lead leg swings over the bar, the trail leg comes round over it, and the lead foot lands beyond, where a run may take the stride on.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanJump.hurdleClear is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanJump.hurdleClear is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanJump.hurdleClear is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanJump.hurdleClear is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanJump.hurdleClear is provided by the chain that implements IAutoMovieMotionHumanJump.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanJump.hurdleClear is provided by the chain that implements IAutoMovieMotionHumanJump.
   */
  hurdleClear(params: IAutoMovieMotionHumanJump.IHurdleClear, anchor?: string): Chain;
}

/**
 * The parameter types of the Jump methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Jump method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanJump {
  /** The parameters of `jump`. */
  export type IJump = ILegacyJump.IParams;

  /** The parameters of `horizontalJump`. */
  export type IHorizontalJump = IAutoMovieMotionHumanHorizontalJump.IParams;

  /** The parameters of `highJump`. */
  export type IHighJump = IAutoMovieMotionHumanHighJump.IParams;

  /** The parameters of `poleVault`. */
  export type IPoleVault = IAutoMovieMotionHumanPoleVault.IParams;

  /** The parameters of `hurdleClear`. */
  export type IHurdleClear = IAutoMovieMotionHumanHurdleClear.IParams;
}
