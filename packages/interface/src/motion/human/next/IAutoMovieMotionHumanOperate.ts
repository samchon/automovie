import type { IAutoMovieMotionHumanHeldWork } from "../handling/IAutoMovieMotionHumanHeldWork";
import type { IAutoMovieMotionHumanLongTool } from "../tasks/IAutoMovieMotionHumanLongTool";
import type { IAutoMovieMotionHumanManipulate } from "../handling/IAutoMovieMotionHumanManipulate";
import type { IAutoMovieMotionHumanOperate as ILegacyOperate } from "../affordance/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanPour } from "../affordance/IAutoMovieMotionHumanPour";
import type { IAutoMovieMotionHumanPushPull } from "../handling/IAutoMovieMotionHumanPushPull";
import type { IAutoMovieMotionHumanPushSled } from "../handling/IAutoMovieMotionHumanPushSled";
import type { IAutoMovieMotionHumanThrowPottery } from "../handling/IAutoMovieMotionHumanThrowPottery";
import type { IAutoMovieMotionHumanTypeText } from "../everyday/IAutoMovieMotionHumanTypeText";
import type { IAutoMovieMotionHumanUseTool } from "../tasks/IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "../tasks/IAutoMovieMotionHumanWipe";

/**
 * Mechanism: Working an object or a device by hand: a control, a pour, a tool, writing or typing, and pushing or pulling a load.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Operate family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Operate laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanOperate<Chain> {
  /**
   * Operating an articulated thing with one hand while standing: pressing a button along its axis, turning a knob about its axis, pulling or pushing a drawer along its slide, or swinging a hinged door by its handle.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.operate: Operating an articulated thing with one hand while standing: pressing a button along its axis, turning a knob about its axis, pulling or pushing a drawer along its slide, or swinging a hinged door by its handle.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  operate(params: IAutoMovieMotionHumanOperate.IOperate, anchor?: string): Chain;

  /**
   * Authoring contracts for one staged liquid transfer between rigid props.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.pour: Authoring contracts for one staged liquid transfer between rigid props.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.pour is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.pour is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.pour is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.pour is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.pour is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.pour is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  pour(params: IAutoMovieMotionHumanOperate.IPour, anchor?: string): Chain;

  /**
   * A keyed contact sequence: digits of one hand or both pressing sites of a prop one after another, timed by the caller or by skill.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.manipulate: A keyed contact sequence: digits of one hand or both pressing sites of a prop one after another, timed by the caller or by skill.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  manipulate(params: IAutoMovieMotionHumanOperate.IManipulate, anchor?: string): Chain;

  /**
   * Working a prop the hand already holds: its fingers drive the prop's own articulations (scissor blades closed by the rings, a folding knife's blade swung open, a chopstick pinched), the hand may carry it to a place before the body (a tray raised on the palm, an umbrella over the head), and the prop may take another prop onto one of its sockets (a morsel pinched between chopstick tips).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.workHeld: Working a prop the hand already holds: its fingers drive the prop's own articulations (scissor blades closed by the rings, a folding knife's blade swung open, a chopstick pinched), the hand may carry it to a place before the body (a tray raised on the palm, an umbrella over the head), and the prop may take another prop onto one of its sockets (a morsel pinched between chopstick tips).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  workHeld(params: IAutoMovieMotionHumanOperate.IWorkHeld, anchor?: string): Chain;

  /**
   * Working with a one-handed tool held in the hand, in cycles over a work point while standing: hammering, sawing, stirring or turning a screwdriver.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.useTool: Working with a one-handed tool held in the hand, in cycles over a work point while standing: hammering, sawing, stirring or turning a screwdriver.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  useTool(params: IAutoMovieMotionHumanOperate.IUseTool, anchor?: string): Chain;

  /**
   * Work with a long tool held in two hands, standing, in cycles at a work point: chopping and splitting with an axe, a side chop at a standing trunk, a sledgehammer or pickaxe swung at the ground, digging and throwing with a shovel, and raking.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.longTool: Work with a long tool held in two hands, standing, in cycles at a work point: chopping and splitting with an axe, a side chop at a standing trunk, a sledgehammer or pickaxe swung at the ground, digging and throwing with a shovel, and raking.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  longTool(params: IAutoMovieMotionHumanOperate.ILongTool, anchor?: string): Chain;

  /**
   * Typing a text on a keyboard from the posture the performer is in (seated at a desk, or standing at a counter), pressing each key with an index fingertip.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.typeText: Typing a text on a keyboard from the posture the performer is in (seated at a desk, or standing at a counter), pressing each key with an index fingertip.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  typeText(params: IAutoMovieMotionHumanOperate.ITypeText, anchor?: string): Chain;

  /**
   * Wiping a table, counter or other level surface with the flat palm in circles, standing before it: a household task (#3256) that the composed laws lacked, the palm's circling stroke on a work surface.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.wipe: Wiping a table, counter or other level surface with the flat palm in circles, standing before it: a household task (#3256) that the composed laws lacked, the palm's circling stroke on a work surface.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.wipe is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.wipe is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.wipe is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.wipe is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.wipe is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.wipe is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  wipe(params: IAutoMovieMotionHumanOperate.IWipe, anchor?: string): Chain;

  /**
   * A heavy load that is not carried moved by its two handles (#3351): a crate, a wardrobe or a car pushed ahead walking forward, pulled toward the body walking backward, or a sack dragged behind walking forward; or pushed and pulled at and not moved at all, the scene where force is shown and nothing moves.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.pushPull: A heavy load that is not carried moved by its two handles (#3351): a crate, a wardrobe or a car pushed ahead walking forward, pulled toward the body walking backward, or a sack dragged behind walking forward; or pushed and pulled at and not moved at all, the scene where force is shown and nothing moves.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  pushPull(params: IAutoMovieMotionHumanOperate.IPushPull, anchor?: string): Chain;

  /**
   * A pushed load's handles held in both hands through a walk: a sled push.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.pushSled: A pushed load's handles held in both hands through a walk: a sled push.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  pushSled(params: IAutoMovieMotionHumanOperate.IPushSled, anchor?: string): Chain;

  /**
   * Throwing pottery: seated at a wheel, both hands keep contact with the clay wall, one inside and one outside, while the wheel head turns and the wall is drawn up.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanOperate.throwPottery: Throwing pottery: seated at a wheel, both hands keep contact with the clay wall, one inside and one outside, while the wheel head turns and the wall is drawn up.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  throwPottery(params: IAutoMovieMotionHumanOperate.IThrowPottery, anchor?: string): Chain;
}

/**
 * The parameter types of the Operate methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Operate method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanOperate {
  /** The parameters of `operate`. */
  export type IOperate = ILegacyOperate.IParams;

  /** The parameters of `pour`. */
  export type IPour = IAutoMovieMotionHumanPour.IParams;

  /** The parameters of `manipulate`. */
  export type IManipulate = IAutoMovieMotionHumanManipulate.IParams;

  /** The parameters of `workHeld`. */
  export type IWorkHeld = IAutoMovieMotionHumanHeldWork.IParams;

  /** The parameters of `useTool`. */
  export type IUseTool = IAutoMovieMotionHumanUseTool.IParams;

  /** The parameters of `longTool`. */
  export type ILongTool = IAutoMovieMotionHumanLongTool.IParams;

  /** The parameters of `typeText`. */
  export type ITypeText = IAutoMovieMotionHumanTypeText.IParams;

  /** The parameters of `wipe`. */
  export type IWipe = IAutoMovieMotionHumanWipe.IParams;

  /** The parameters of `pushPull`. */
  export type IPushPull = IAutoMovieMotionHumanPushPull.IParams;

  /** The parameters of `pushSled`. */
  export type IPushSled = IAutoMovieMotionHumanPushSled.IParams;

  /** The parameters of `throwPottery`. */
  export type IThrowPottery = IAutoMovieMotionHumanThrowPottery.IParams;
}
