import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanLasso } from "../lexicon/IAutoMovieMotionHumanLasso";
import type { IAutoMovieMotionHumanLexiconArcheryParams } from "../lexicon/IAutoMovieMotionHumanLexiconArcheryParams";
import type { IAutoMovieMotionHumanWeaponPresent } from "../lexicon/IAutoMovieMotionHumanWeaponPresent";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";

/**
 * Archery and the thrown weapons: taking and nocking an arrow, presenting and drawing a bow, loosing it, spanning, presenting and shooting a crossbow, throwing a weapon and swinging a lasso.
 *
 * The shared grasp and placement laws take the inert prop from its slot to a moving socket (the quiver's slot site, the bow's `nock` socket). The release laws can hand the prop off to a scene-authored animation carrier on a film cue (`IAutoMovieMotionHumanLexiconArcheryParams.IContinuation`). The family fixes no draw time, hold time or arrow speed: the pick up, put down and operate laws time the actions, and the flight belongs to the carrier.
 *
 * The presets are the constants of `AutoMovieMotionHumanArchery` that the rows read: `PRESENT_BOW` (the bow held out in one hand from the face along the line from its `nock`, the bow arm extended), `THROW_JAVELIN` (the javelin and the spear thrown overarm at the middle of the elite release angles Campos, Brizuela and Ramon 2004 measured, 27.7 to 40.1 degrees, 33.9 degrees, the shaft along its velocity) and `THROW_KNIFE` (overarm, spinning whole half turns to the target).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared grasp and release model, what it leaves to the carrier and the preset constants.
 * @evidence contracts/development/design.md#principled-representation One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's laws and presets and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.
 */
export interface IAutoMovieMotionHumanArchery<Chain> {
  /**
   * Take an arrow by its shaft just ahead of the nock, from where the composition says it lies.
   *
   * @param params The members of `IAutoMovieMotionHumanPickUp.IParams` except the handle, which the law fixes at the nock grip.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  takeArrow(
    params: IAutoMovieMotionHumanArchery.ITakeArrow,
    anchor?: string,
  ): Chain;

  /**
   * Set the arrow's nock on the bow's `nock` socket, its shaft on the bow's `rest`.
   *
   * @param params The members of `IAutoMovieMotionHumanPutDown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  nockArrow(
    params: IAutoMovieMotionHumanPutDown.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Hold the bow out in one hand on the line from the face to the target, the bow arm extended.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IPresent` except the anchor, the hands, the line origin, the tip, the edge and the extension, which the preset fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  presentBow(
    params: IAutoMovieMotionHumanArchery.IPresentBow,
    anchor?: string,
  ): Chain;

  /**
   * Draw the string back to the anchor under the chin, over `presentBow`.
   *
   * @param params The members of `IAutoMovieMotionHumanOperate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  drawBow(params: IAutoMovieMotionHumanOperate.IParams, anchor?: string): Chain;

  /**
   * Release the arrow prop, or hand it off to an authored continuation at the cue.
   *
   * @param params The members of `IAutoMovieMotionHumanRelease.IParams` and the optional `continuation`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  loose(params: IAutoMovieMotionHumanArchery.ILoose, anchor?: string): Chain;

  /**
   * Span a crossbow by its string, a straight pull with the foot in the stirrup, or by its crank, to full travel.
   *
   * @param params The members of `IAutoMovieMotionHumanOperate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  spanCrossbow(
    params: IAutoMovieMotionHumanOperate.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Hold the crossbow to the cheek on the line to the target.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IPresent` except the anchor.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  presentCrossbow(
    params: IAutoMovieMotionHumanArchery.IPresentCrossbow,
    anchor?: string,
  ): Chain;

  /**
   * Cue the crossbow's visible release and hand the bolt off to a continuation when supplied.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IWield` and the optional `continuation`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  shootCrossbow(
    params: IAutoMovieMotionHumanArchery.IShootCrossbow,
    anchor?: string,
  ): Chain;

  /**
   * Throw a held weapon (a javelin, spear, knife, grenade, stone, bottle, sling stone or atlatl dart) at the target on the range the stand-off gives.
   *
   * @param params The members of `IAutoMovieMotionHumanThrowObjectParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  throwWeapon(
    params: IAutoMovieMotionHumanThrowObjectParams,
    anchor?: string,
  ): Chain;

  /**
   * Rope from the saddle: swing the lariat's loop overhead in time with the horse's stride, throw it at a target on a moving animal and dally the rope round the saddle horn.
   *
   * @param params The members of `IAutoMovieMotionHumanLasso`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  lasso(params: IAutoMovieMotionHumanLasso, anchor?: string): Chain;
}

/**
 * The parameter and preset types of the family's methods.
 */
export namespace IAutoMovieMotionHumanArchery {
  /**
   * The parameters of `takeArrow`: the pick up without the handle, which the law fixes at the nock grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises, the type it narrows and the members that narrowing removes.
   * @evidence contracts/development/design.md#principled-representation A named narrowing of `IAutoMovieMotionHumanPickUp.IParams`: every member kept has the units, frames, defaults and invariants that type states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the members; this alias names the narrowing so no signature writes it inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITakeArrow = Omit<IAutoMovieMotionHumanPickUp.IParams, "handle">;

  /**
   * The parameters of `presentBow`: the presentation without the anchor, hands, line origin, tip, edge and extension that the bow fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises, the type it narrows and the members that narrowing removes.
   * @evidence contracts/development/design.md#principled-representation A named narrowing of `IAutoMovieMotionHumanWeaponPresent.IPresent`: every member kept has the units, frames, defaults and invariants that type states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IPresent` owns the members; this alias names the narrowing so no signature writes it inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IPresentBow = Omit<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "anchor" | "hands" | "from" | "tip" | "edge" | "extended"
  >;

  /**
   * The parameters of `loose`: the release of the drawing hand, with the optional authored continuation after the cue.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the law type it extends and the member it adds.
   * @evidence contracts/development/design.md#principled-representation `IAutoMovieMotionHumanRelease.IParams` keeps its units, frames and invariants; the added member is the one the row's continuation reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRelease.IParams` owns the parameters; the interface adds only the staged continuation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the law's members are inherited unchanged.
   */
  export interface ILoose extends IAutoMovieMotionHumanRelease.IParams {
    /** The staged arrow and its animation carrier. Incompatible with `prop` or `launch`. */
    continuation?: IAutoMovieMotionHumanLexiconArcheryParams.IContinuation;
  }

  /**
   * The parameters of `presentCrossbow`: the presentation without the anchor, which the crossbow fixes at the cheek.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises, the type it narrows and the members that narrowing removes.
   * @evidence contracts/development/design.md#principled-representation A named narrowing of `IAutoMovieMotionHumanWeaponPresent.IPresent`: every member kept has the units, frames, defaults and invariants that type states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IPresent` owns the members; this alias names the narrowing so no signature writes it inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IPresentCrossbow = Omit<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "anchor"
  >;

  /**
   * The parameters of `shootCrossbow`: the crossbow's trigger and string cue, with the optional authored continuation for the bolt.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the law type it extends and the member it adds.
   * @evidence contracts/development/design.md#principled-representation `IAutoMovieMotionHumanWeaponPresent.IWield` keeps its units, frames and invariants; the added member is the one the row's continuation reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IWield` owns the parameters; the interface adds only the staged continuation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the law's members are inherited unchanged.
   */
  export interface IShootCrossbow
    extends IAutoMovieMotionHumanWeaponPresent.IWield {
    /** The staged bolt and its animation carrier. Incompatible with `shot`. */
    continuation?: IAutoMovieMotionHumanLexiconArcheryParams.IContinuation;
  }

  /**
   * The presentation the `PRESENT_BOW` preset fixes: anchored at the face, one hand, the line from the `nock` through the `rest`, the grip as the edge and the bow arm extended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanWeaponPresent.IPresent` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanWeaponPresent.IPresent` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IPresent` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IPresentBowPreset = Pick<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "anchor" | "hands" | "from" | "tip" | "edge" | "extended"
  >;

  /**
   * The throw the `THROW_JAVELIN` preset fixes: overarm at 33.9 degrees, the shaft along its velocity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanThrowObjectParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanThrowObjectParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanThrowObjectParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IJavelinPreset = Pick<
    IAutoMovieMotionHumanThrowObjectParams,
    "style" | "angle" | "attitude"
  >;

  /**
   * The throw the `THROW_KNIFE` preset fixes: overarm, spinning whole half turns to the target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanThrowObjectParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanThrowObjectParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanThrowObjectParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IKnifePreset = Pick<
    IAutoMovieMotionHumanThrowObjectParams,
    "style" | "attitude"
  >;
}
