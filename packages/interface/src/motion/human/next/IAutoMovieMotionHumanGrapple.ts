import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanDisarm } from "../grappling/IAutoMovieMotionHumanDisarm";
import type { IAutoMovieMotionHumanForceResponse } from "../grappling/IAutoMovieMotionHumanForceResponse";
import type { IAutoMovieMotionHumanGrapple as ILegacyGrapple } from "../grappling/IAutoMovieMotionHumanGrapple";
import type { IAutoMovieMotionHumanHostageHold } from "../grappling/IAutoMovieMotionHumanHostageHold";
import type { IAutoMovieMotionHumanKuzushi } from "../grappling/IAutoMovieMotionHumanKuzushi";
import type { IAutoMovieMotionHumanLungeGrab } from "../grappling/IAutoMovieMotionHumanLungeGrab";

/**
 * Mechanism: Holds, throws and clinches between two bodies. The grappling law reads no skill: its scene lengths are authored.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Grapple family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Grapple laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanGrapple<Chain> {
  /**
   * Taking a clinch grip on a partner standing within reach and holding it: the two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip (`collarSleeve`, kumikata).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.clinch: Taking a clinch grip on a partner standing within reach and holding it: the two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip (`collarSleeve`, kumikata).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.clinch is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  clinch(params: IAutoMovieMotionHumanGrapple.IClinch, anchor?: string): Chain;

  /**
   * Inputs shared by two actors in a preplanned sport grappling scene.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.grapple: Inputs shared by two actors in a preplanned sport grappling scene.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.grapple is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  grapple(params: IAutoMovieMotionHumanGrapple.IGrapple, anchor?: string): Chain;

  /**
   * A broken base (kuzushi): the receiver of a judo throw drawn off balance forward, the whole body tipped about the ankles over the toes while the feet stay on the floor, the stage before a throw carries the body over.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.kuzushi: A broken base (kuzushi): the receiver of a judo throw drawn off balance forward, the whole body tipped about the ankles over the toes while the feet stay on the floor, the stage before a throw carries the body over.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.kuzushi is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  kuzushi(params: IAutoMovieMotionHumanGrapple.IKuzushi, anchor?: string): Chain;

  /**
   * A sudden lunge that closes both hands on a victim's region, as a shambler breaks from its walk: the front foot steps long, the trunk pitches forward and the hands close on the region through the stage.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.lungeGrab: A sudden lunge that closes both hands on a victim's region, as a shambler breaks from its walk: the front foot steps long, the trunk pitches forward and the hands close on the region through the stage.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.lungeGrab is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  lungeGrab(params: IAutoMovieMotionHumanGrapple.ILungeGrab, anchor?: string): Chain;

  /**
   * A partner's response to a pull through grips (#3439), the outcomes of `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.forceResponse: A partner's response to a pull through grips (#3439), the outcomes of `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.forceResponse is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  forceResponse(params: IAutoMovieMotionHumanGrapple.IForceResponse, anchor?: string): Chain;

  /**
   * A staged disarm: the defender takes a knife or a handgun from a resisting partner, and the partner's hand gives it up.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.disarm: A staged disarm: the defender takes a knife or a handgun from a resisting partner, and the partner's hand gives it up.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.disarm is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.disarm is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.disarm is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.disarm is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.disarm is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.disarm is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  disarm(params: IAutoMovieMotionHumanGrapple.IDisarm, anchor?: string): Chain;

  /**
   * A hostage hold from behind: the holder's free arm lies across the hostage's chest or neck, the other hand presents a held weapon at the hostage's head or throat, and the pair walks backward together.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGrapple.hostageHold: A hostage hold from behind: the holder's free arm lies across the hostage's chest or neck, the other hand presents a held weapon at the hostage's head or throat, and the pair walks backward together.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGrapple.hostageHold is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGrapple.hostageHold is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGrapple.hostageHold is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGrapple.hostageHold is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGrapple.hostageHold is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGrapple.hostageHold is provided by the chain that implements IAutoMovieMotionHumanGrapple.
   */
  hostageHold(params: IAutoMovieMotionHumanGrapple.IHostageHold, anchor?: string): Chain;
}

/**
 * The parameter types of the Grapple methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Grapple method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanGrapple {
  /** The parameters of `clinch`. */
  export type IClinch = IAutoMovieMotionHumanClinch.IParams;

  /** The parameters of `grapple`. */
  export type IGrapple = ILegacyGrapple.IParams;

  /** The parameters of `kuzushi`. */
  export type IKuzushi = IAutoMovieMotionHumanKuzushi.IParams;

  /** The parameters of `lungeGrab`. */
  export type ILungeGrab = IAutoMovieMotionHumanLungeGrab.IParams;

  /** The parameters of `forceResponse`. */
  export type IForceResponse = IAutoMovieMotionHumanForceResponse.IParams;

  /** The parameters of `disarm`. */
  export type IDisarm = IAutoMovieMotionHumanDisarm.IParams;

  /** The parameters of `hostageHold`. */
  export type IHostageHold = IAutoMovieMotionHumanHostageHold.IParams;
}
