import type { IAutoMovieMotionHumanHandoverAction } from "../handling/IAutoMovieMotionHumanHandoverAction";
import type { IAutoMovieMotionHumanHandshake } from "../handling/IAutoMovieMotionHumanHandshake";
import type { IAutoMovieMotionHumanReceive } from "../handling/IAutoMovieMotionHumanReceive";
import type { IAutoMovieMotionHumanRelayPass } from "../handling/IAutoMovieMotionHumanRelayPass";

/**
 * Mechanism: Passing an object between two people: giving, receiving, relaying and the handshake.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Handover family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Handover laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanHandover<Chain> {
  /**
   * The giver's authored parameters for offering a held prop to a receiver.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandover.handOver: The giver's authored parameters for offering a held prop to a receiver.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandover.handOver is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandover.handOver is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandover.handOver is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandover.handOver is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandover.handOver is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandover.handOver is provided by the chain that implements IAutoMovieMotionHumanHandover.
   */
  handOver(params: IAutoMovieMotionHumanHandover.IHandOver, anchor?: string): Chain;

  /**
   * Taking a prop a giver holds out: the receiver's half of a handover.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandover.receive: Taking a prop a giver holds out: the receiver's half of a handover.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandover.receive is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandover.receive is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandover.receive is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandover.receive is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandover.receive is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandover.receive is provided by the chain that implements IAutoMovieMotionHumanHandover.
   */
  receive(params: IAutoMovieMotionHumanHandover.IReceive, anchor?: string): Chain;

  /**
   * A relay baton pass, one role of it, performed over a run (`HumanChain.over`): the outgoing runner's hand goes back, open, palm back, and the incoming runner pushes the baton's end into it at a film second both roles state alike (`at`), from where the baton passes to the outgoing hand.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandover.relayPass: A relay baton pass, one role of it, performed over a run (`HumanChain.over`): the outgoing runner's hand goes back, open, palm back, and the incoming runner pushes the baton's end into it at a film second both roles state alike (`at`), from where the baton passes to the outgoing hand.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandover.relayPass is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandover.relayPass is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandover.relayPass is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandover.relayPass is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandover.relayPass is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandover.relayPass is provided by the chain that implements IAutoMovieMotionHumanHandover.
   */
  relayPass(params: IAutoMovieMotionHumanHandover.IRelayPass, anchor?: string): Chain;

  /**
   * Shaking hands with a partner: both bring the same hand's palm to one shared point, clasp, pump together and let go.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandover.handshake: Shaking hands with a partner: both bring the same hand's palm to one shared point, clasp, pump together and let go.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandover.handshake is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandover.handshake is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandover.handshake is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandover.handshake is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandover.handshake is provided by the chain that implements IAutoMovieMotionHumanHandover.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandover.handshake is provided by the chain that implements IAutoMovieMotionHumanHandover.
   */
  handshake(params: IAutoMovieMotionHumanHandover.IHandshake, anchor?: string): Chain;
}

/**
 * The parameter types of the Handover methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Handover method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanHandover {
  /** The parameters of `handOver`. */
  export type IHandOver = IAutoMovieMotionHumanHandoverAction.IParams;

  /** The parameters of `receive`. */
  export type IReceive = IAutoMovieMotionHumanReceive.IParams;

  /** The parameters of `relayPass`. */
  export type IRelayPass = IAutoMovieMotionHumanRelayPass.IParams;

  /** The parameters of `handshake`. */
  export type IHandshake = IAutoMovieMotionHumanHandshake.IParams;
}
