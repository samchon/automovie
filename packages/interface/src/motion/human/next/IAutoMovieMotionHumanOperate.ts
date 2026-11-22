import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanOperateInsert } from "../affordance/IAutoMovieMotionHumanOperateInsert";
import type { IAutoMovieMotionHumanPour } from "../affordance/IAutoMovieMotionHumanPour";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanSwipeTouchscreen } from "../everyday/IAutoMovieMotionHumanSwipeTouchscreen";
import type { IAutoMovieMotionHumanTypeText } from "../everyday/IAutoMovieMotionHumanTypeText";
import type { IAutoMovieMotionHumanButton } from "../handling/IAutoMovieMotionHumanButton";
import type { IAutoMovieMotionHumanHeldWork } from "../handling/IAutoMovieMotionHumanHeldWork";
import type { IAutoMovieMotionHumanManipulate } from "../handling/IAutoMovieMotionHumanManipulate";
import type { IAutoMovieMotionHumanPushPull } from "../handling/IAutoMovieMotionHumanPushPull";
import type { IAutoMovieMotionHumanPushSled } from "../handling/IAutoMovieMotionHumanPushSled";
import type { IAutoMovieMotionHumanThrowPottery } from "../handling/IAutoMovieMotionHumanThrowPottery";
import type { IAutoMovieMotionHumanWrite } from "../handling/IAutoMovieMotionHumanWrite";
import type { IAutoMovieMotionHumanZip } from "../handling/IAutoMovieMotionHumanZip";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanHoldHandles } from "../lexicon/IAutoMovieMotionHumanHoldHandles";
import type { IAutoMovieMotionHumanHookSet } from "../tasks/IAutoMovieMotionHumanHookSet";
import type { IAutoMovieMotionHumanLongTool } from "../tasks/IAutoMovieMotionHumanLongTool";
import type { IAutoMovieMotionHumanUseTool } from "../tasks/IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "../tasks/IAutoMovieMotionHumanWipe";

/**
 * Working an object or a device by hand: a control, a pour, a tool, writing or typing, and pushing or pulling a load.
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
   * @param params The `balance`, `mechanism`, `hand` and `manner` of `IAutoMovieMotionHumanOperate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.operate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  operate(
    params: IAutoMovieMotionHumanOperate.IOperate,
    anchor?: string,
  ): Chain;

  /**
   * Pour a liquid between two rigid props: the source is tilted over the target until the transferred volume has left it, then righted.
   *
   * @param params The `source`, `target`, `hand`, `tilt`, `gap`, `timing`, `sourceMl`, `targetMl`, `capacityMl` and `transferMl` of `IAutoMovieMotionHumanPour.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
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
   * @param params The `prop`, `contacts`, `text`, `side` and `digit` of `IAutoMovieMotionHumanManipulate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.manipulate is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  manipulate(
    params: IAutoMovieMotionHumanOperate.IManipulate,
    anchor?: string,
  ): Chain;

  /**
   * Working a prop the hand already holds: its fingers drive the prop's own articulations (scissor blades closed by the rings, a folding knife's blade swung open, a chopstick pinched), the hand may carry it to a place before the body (a tray raised on the palm, an umbrella over the head), and the prop may take another prop onto one of its sockets (a morsel pinched between chopstick tips).
   *
   * @param params The `prop`, `side`, `drive`, `at`, `take`, `push` and `seconds` of `IAutoMovieMotionHumanHeldWork.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.workHeld is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  workHeld(
    params: IAutoMovieMotionHumanOperate.IWorkHeld,
    anchor?: string,
  ): Chain;

  /**
   * Working with a one-handed tool held in the hand, in cycles over a work point while standing: hammering, sawing, stirring or turning a screwdriver.
   *
   * @param params The `tool`, `prop`, `on`, `hand`, `cycles` and `manner` of `IAutoMovieMotionHumanUseTool.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.useTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  useTool(
    params: IAutoMovieMotionHumanOperate.IUseTool,
    anchor?: string,
  ): Chain;

  /**
   * Work with a long tool held in two hands, standing, in cycles at a work point: chopping and splitting with an axe, a side chop at a standing trunk, a sledgehammer or pickaxe swung at the ground, digging and throwing with a shovel, and raking.
   *
   * @param params The `stroke`, `prop`, `at`, `to`, `hand` and `cycles` of `IAutoMovieMotionHumanLongTool.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.longTool is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  longTool(
    params: IAutoMovieMotionHumanOperate.ILongTool,
    anchor?: string,
  ): Chain;

  /**
   * Typing a text on a keyboard from the posture the performer is in (seated at a desk, or standing at a counter), pressing each key with an index fingertip.
   *
   * @param params The `keyboard` and `text` of `IAutoMovieMotionHumanTypeText.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.typeText is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  typeText(
    params: IAutoMovieMotionHumanOperate.ITypeText,
    anchor?: string,
  ): Chain;

  /**
   * Wiping a table, counter or other level surface with the flat palm in circles, standing before it: a household task (#3256) that the composed laws lacked, the palm's circling stroke on a work surface.
   *
   * @param params The `balance`, `on`, `hand`, `cycles` and `manner` of `IAutoMovieMotionHumanWipe.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
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
   * @param params The `prop`, `way`, `to`, `left`, `right`, `load`, `moves` and `seconds` of `IAutoMovieMotionHumanPushPull.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.pushPull is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  pushPull(
    params: IAutoMovieMotionHumanOperate.IPushPull,
    anchor?: string,
  ): Chain;

  /**
   * A pushed load's handles held in both hands through a walk: a sled push.
   *
   * @param params The `sled`, `to`, `left`, `right`, `lean`, `incline`, `facing`, `seconds` and `moves` of `IAutoMovieMotionHumanPushSled.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.pushSled is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  pushSled(
    params: IAutoMovieMotionHumanOperate.IPushSled,
    anchor?: string,
  ): Chain;

  /**
   * Throwing pottery: seated at a wheel, both hands keep contact with the clay wall, one inside and one outside, while the wheel head turns and the wall is drawn up.
   *
   * @param params The `wheel`, `rise`, `rpm` and `seconds` of `IAutoMovieMotionHumanThrowPottery.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.throwPottery is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  throwPottery(
    params: IAutoMovieMotionHumanOperate.IThrowPottery,
    anchor?: string,
  ): Chain;

  /**
   * A one-finger swipe along the local X axis of a stationary screen, centred in its depth.
   *
   * @param params The `prop`, `screen`, `from`, `to`, `hand` and `duration` of `IAutoMovieMotionHumanSwipeTouchscreen`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.swipeTouchscreen is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.swipeTouchscreen is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.swipeTouchscreen is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.swipeTouchscreen is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.swipeTouchscreen is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.swipeTouchscreen is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  swipeTouchscreen(
    params: IAutoMovieMotionHumanOperate.ISwipeTouchscreen,
    anchor?: string,
  ): Chain;

  /**
   * One stroke by a tool the performer already holds, traced on a fixed prop's surface through authored planar points.
   *
   * @param params The `tool`, `tip`, `on`, `surface`, `stroke`, `duration`, `hand`, `steady`, `drive`, `take`, `leave` and `release` of `IAutoMovieMotionHumanWrite`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.write is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.write is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.write is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.write is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.write is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.write is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  write(params: IAutoMovieMotionHumanOperate.IWrite, anchor?: string): Chain;

  /**
   * Pushing a button through the rectangular clear opening of a fixed garment prop, on a rigid straight slider.
   *
   * @param params The `garment`, `opening`, `rim`, `button`, `contact`, `travel`, `radius`, `thickness`, `duration` and `hand` of `IAutoMovieMotionHumanButton`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.button is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.button is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.button is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.button is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.button is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.button is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  button(params: IAutoMovieMotionHumanOperate.IButton, anchor?: string): Chain;

  /**
   * Opening or closing a straight closed-end zipper on a supported stationary pouch.
   *
   * @param params The `pouch`, `thumb`, `index`, `brace`, `travel`, `duration` and `hand` of `IAutoMovieMotionHumanZip`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.zip is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.zip is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.zip is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.zip is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.zip is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.zip is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  zip(params: IAutoMovieMotionHumanOperate.IZip, anchor?: string): Chain;

  /**
   * Setting the hook: the hand holding a fishing rod lifts its tip sharply by an angle in a set time, turning the rod about the grip.
   *
   * @param params The `rod`, `angle`, `duration` and `hand` of `IAutoMovieMotionHumanHookSet`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.hookSet is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.hookSet is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.hookSet is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.hookSet is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.hookSet is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.hookSet is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  hookSet(
    params: IAutoMovieMotionHumanOperate.IHookSet,
    anchor?: string,
  ): Chain;

  /**
   * Walking behind an implement with both hands on its two handles, as a ploughman holds a walking plough, as an arms overlay over an authored walk.
   *
   * @param params The implement `on`, its `left` and `right` handles, `duration` and `transition` of `IAutoMovieMotionHumanHoldHandles`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanOperate.holdHandles is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanOperate.holdHandles is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanOperate.holdHandles is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanOperate.holdHandles is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanOperate.holdHandles is provided by the chain that implements IAutoMovieMotionHumanOperate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanOperate.holdHandles is provided by the chain that implements IAutoMovieMotionHumanOperate.
   */
  holdHandles(
    params: IAutoMovieMotionHumanOperate.IHoldHandles,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Operate methods.
 */
export namespace IAutoMovieMotionHumanOperate {
  /**
   * The parameters of `operate`: `IAutoMovieMotionHumanOperate.IParams` (`affordance/IAutoMovieMotionHumanOperate`), the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanOperate.IParams` (`affordance/IAutoMovieMotionHumanOperate`): the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanOperate.IParams` (`affordance/IAutoMovieMotionHumanOperate`) owns the shape; the alias serves `operate` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IOperate = IAutoMovieMotionHumanOperate.IParams;

  /**
   * The parameters of `pour`: `IAutoMovieMotionHumanPour.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPour.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPour.IParams` owns the shape; the alias serves `pour` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPour = IAutoMovieMotionHumanPour.IParams;

  /**
   * The parameters of `manipulate`: `IAutoMovieMotionHumanManipulate.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanManipulate.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanManipulate.IParams` owns the shape; the alias serves `manipulate` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IManipulate = IAutoMovieMotionHumanManipulate.IParams;

  /**
   * The parameters of `workHeld`: `IAutoMovieMotionHumanHeldWork.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHeldWork.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHeldWork.IParams` owns the shape; the alias serves `workHeld` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IWorkHeld = IAutoMovieMotionHumanHeldWork.IParams;

  /**
   * The parameters of `useTool`: `IAutoMovieMotionHumanUseTool.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanUseTool.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanUseTool.IParams` owns the shape; the alias serves `useTool` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IUseTool = IAutoMovieMotionHumanUseTool.IParams;

  /**
   * The parameters of `longTool`: `IAutoMovieMotionHumanLongTool.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanLongTool.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLongTool.IParams` owns the shape; the alias serves `longTool` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ILongTool = IAutoMovieMotionHumanLongTool.IParams;

  /**
   * The parameters of `typeText`: `IAutoMovieMotionHumanTypeText.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanTypeText.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTypeText.IParams` owns the shape; the alias serves `typeText` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ITypeText = IAutoMovieMotionHumanTypeText.IParams;

  /**
   * The parameters of `wipe`: `IAutoMovieMotionHumanWipe.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanWipe.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWipe.IParams` owns the shape; the alias serves `wipe` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IWipe = IAutoMovieMotionHumanWipe.IParams;

  /**
   * The parameters of `pushPull`: `IAutoMovieMotionHumanPushPull.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPushPull.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPushPull.IParams` owns the shape; the alias serves `pushPull` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPushPull = IAutoMovieMotionHumanPushPull.IParams;

  /**
   * The parameters of `pushSled`: `IAutoMovieMotionHumanPushSled.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPushSled.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPushSled.IParams` owns the shape; the alias serves `pushSled` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPushSled = IAutoMovieMotionHumanPushSled.IParams;

  /**
   * The parameters of `throwPottery`: `IAutoMovieMotionHumanThrowPottery.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanThrowPottery.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanThrowPottery.IParams` owns the shape; the alias serves `throwPottery` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IThrowPottery = IAutoMovieMotionHumanThrowPottery.IParams;

  /**
   * The parameters of `swipeTouchscreen`: `IAutoMovieMotionHumanSwipeTouchscreen`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSwipeTouchscreen`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSwipeTouchscreen` owns the shape; the alias serves `swipeTouchscreen` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISwipeTouchscreen = IAutoMovieMotionHumanSwipeTouchscreen;

  /**
   * The parameters of `write`: `IAutoMovieMotionHumanWrite`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanWrite`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWrite` owns the shape; the alias serves `write` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IWrite = IAutoMovieMotionHumanWrite;

  /**
   * The parameters of `button`: `IAutoMovieMotionHumanButton`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanButton`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanButton` owns the shape; the alias serves `button` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IButton = IAutoMovieMotionHumanButton;

  /**
   * The parameters of `zip`: `IAutoMovieMotionHumanZip`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanZip`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanZip` owns the shape; the alias serves `zip` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IZip = IAutoMovieMotionHumanZip;

  /**
   * The parameters of `hookSet`: `IAutoMovieMotionHumanHookSet`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHookSet`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHookSet` owns the shape; the alias serves `hookSet` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IHookSet = IAutoMovieMotionHumanHookSet;

  /**
   * The parameters of `holdHandles`: `IAutoMovieMotionHumanHoldHandles`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHoldHandles`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHoldHandles` owns the shape; the alias serves `holdHandles` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IHoldHandles = IAutoMovieMotionHumanHoldHandles;
}

/**
 * Operating an articulated thing with one hand while standing: pressing a
 * button along its axis, turning a knob about its axis, pulling or pushing a
 * drawer along its slide, or swinging a hinged door by its handle.
 *
 * The goal is the hand on the thing's moving part, and the part's motion is
 * the mechanism's own: a button's face goes in along its axis, a knob turns
 * about its axis, a slider's handle travels along its axis, a leaf's handle
 * turns about its hinge line: a door's vertical line through the point it
 * names, or the prop's own hinge axis (a cock's cross pin,
 * `operateDrive.hinge`). The hand is shaped to the part (the
 * index fingertip on a button, a closed grip on a knob, a drawer handle or a
 * door handle) and laid on it by `AutoMovieMotionHumanTarget.hand`. A part
 * on an upright face is grasped with the hand along the face's normal: a
 * handle overhand, the palm on its top; a knob with that grasp rolled about
 * the axis, and the hand rolls with the knob as it turns, the forearm's
 * pronation and supination (Magermans et al. 2005, Clin Biomech 20:591, give
 * the ranges daily tasks use), the grip starting half the turn before the
 * forearm's neutral so the turn is centred in that range. A lid's knob, its
 * axis nearer the vertical than `UPRIGHT`, takes the palm from above. Each
 * part's place is a target, so it can be a
 * prop's point; the part's outward normal is its axis. A part beyond the
 * standing arm is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk
 * tips about the hips by the least pitch that keeps the wrist within `REACH`
 * of the arm's length and straightens as the part comes nearer (a drawer
 * pulled out); a part still out of reach at the lean's limit is refused,
 * since it is walked up to first.
 *
 * The action is one arm phrase (`AutoMovieMotionHumanArm.stroke`): the hand
 * reaches the part by `ready` in the aimed movement time to its width
 * (McIntosh et al. 2018), waits a brief moment for the grip, moves the part
 * from `strokeStart` to `strokeEnd` at the mechanism's pace (`operate.PACE`,
 * provisional): a button's press in 0.25 s, a knob at 180 degrees a second, a
 * slider at 0.4 m/s and a door's handle at 0.6 m/s along its arc, so a door
 * opened through 90 degrees by a handle 0.8 m from the hinge takes about
 * 2.1 s; holds it until `relax`, and returns to where it hung.
 * Events: the phrase's `ready` (contact or grip closed), `strokeStart`,
 * `stroke`, `strokeEnd` (bottom out, travel end, swing end) and `relax`
 * (release).
 *
 * On a prop that articulates (`IAutoMovieMotionHumanProp.articulate`), the operated
 * contact names the articulation it is or rides, the amount is that
 * articulation's travel in its own unit and sign, the hand follows the
 * contact of the prop posed at the travel the stroke has reached, and the
 * plan drives the articulation by the same function (`operateDrive`,
 * `IAutoMovieMotionHumanActionPlan.drives`), so the door stays open after the hand lets go
 * and the hand cannot drift off the handle. The `insert` mechanism moves a
 * held prop's working point along a socket's axis instead
 * (`operateInsert`).
 *
 * Not yet: the A8 affordance kinds (`hinge`, `slider`, `knob`, `button`) in
 * the interface, which the core owns, so the mechanism is stated here; the
 * body stepping round a door and walking through it; two-handed or power
 * grips; pouring from a held container about its lip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hand: The hand; `right` when absent. travel: How far it goes in, metres; 0.005 when absent. turn: How far it turns, degrees; positive clockwise as the hand sees it.
 * @evidence contracts/development/design.md#principled-representation hand: The hand; `right` when absent. travel: How far it goes in, metres; 0.005 when absent. turn: How far it turns, degrees; positive clockwise as the hand sees it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateDrive.ts (operateDrive.part, kind); affordance/operateState.ts (operateState.at, mechanism); affordance/operate.ts (operate.plan, context); chain/HumanChainManual.ts (HumanChainManual.operate, params); affordance/operate.ts (operate.WIDTH); affordance/operate.ts (operate.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieMotionManner, IAutoMovieMotionTarget, IAutoMovieMotionHumanOperateInsert.IMechanism identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanOperate {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The mechanism, the hand and the manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed by the author.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** What is operated. */
    kind: IAutoMovieMotionHumanOperate.Mechanism;

    /** The hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * An articulated part and how it moves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and sign.
   * @evidence contracts/development/design.md#principled-representation The four one-degree-of-freedom mechanisms of household hardware.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed union read by `plan` and `state`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The part's place is a target with a normal; amounts are the mechanism's own.
   */
  export type Mechanism =
    | {
        /** A push button or switch pressed along its axis. */
        kind: "button";
        /** The button's face, its normal pointing out. */
        at: IAutoMovieMotionTarget;
        /** How far it goes in, metres; 0.005 when absent. */
        travel?: number;
      }
    | {
        /** A knob, lid, tap or dial turned about its axis. */
        kind: "knob";
        /** The knob's centre, its normal along the axis toward the hand. */
        at: IAutoMovieMotionTarget;
        /** How far it turns, degrees; positive clockwise as the hand sees it. */
        turn: number;
      }
    | {
        /** A drawer or slider moved along its axis. */
        kind: "slider";
        /** The handle, its normal along the slide toward the hand. */
        at: IAutoMovieMotionTarget;
        /** How far it travels, metres; positive pulls toward the hand. */
        travel: number;
      }
    | {
        /** A leaf swung about its hinge line by its handle: a door, a lid, a gun's cock. */
        kind: "hinge";
        /** The handle, its normal out of the leaf toward the hand. */
        at: IAutoMovieMotionTarget;
        /**
         * A point on a vertical hinge line, a door's. Absent, the line is the
         * operated prop's own hinge articulation (`IAutoMovieMotionHumanOperateDrive.IPart.line`):
         * its point and its `+Y` axis, however it lies, a cock's cross pin.
         */
        hinge?: IAutoMovieMotionTarget;
        /** How far the leaf swings, degrees; positive pulls it toward the hand. */
        swing: number;
      }
    | IAutoMovieMotionHumanOperateInsert.IMechanism;
}
