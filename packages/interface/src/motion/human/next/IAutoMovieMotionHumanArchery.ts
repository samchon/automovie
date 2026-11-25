import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanLasso } from "../lexicon/IAutoMovieMotionHumanLasso";
import type { IAutoMovieMotionHumanLexiconArcheryParams } from "../lexicon/IAutoMovieMotionHumanLexiconArcheryParams";
import type { IAutoMovieMotionHumanWeaponPresent } from "../lexicon/IAutoMovieMotionHumanWeaponPresent";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";

/**
 * Archery and the thrown weapons: taking and nocking an arrow, presenting and
 * drawing a bow, loosing it, spanning, presenting and shooting a crossbow,
 * throwing a weapon and swinging a lasso.
 *
 * The shared grasp and placement laws take the inert prop from its slot to a
 * moving socket (the quiver's slot site, the bow's `nock` socket). The release
 * laws can hand the prop off to a scene-authored animation carrier on a film
 * cue (`IAutoMovieMotionHumanLexiconArcheryParams.IContinuation`). The family
 * fixes no draw time, hold time or arrow speed: the pick up, put down and
 * operate laws time the actions, and the flight belongs to the carrier.
 *
 * The presets are the constants of `AutoMovieMotionHumanArchery` that the rows
 * read: `PRESENT_BOW` (the bow held out in one hand from the face along the
 * line from its `nock`, the bow arm extended), `THROW_JAVELIN` (the javelin and
 * the spear thrown overarm at the middle of the elite release angles Campos,
 * Brizuela and Ramon 2004 measured, 27.7 to 40.1 degrees, 33.9 degrees, the
 * shaft along its velocity) and `THROW_KNIFE` (overarm, spinning whole half
 * turns to the target).
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanArchery` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanArchery<Chain> {
  /**
   * Take an arrow by its shaft just ahead of the nock, from where the
   * composition says it lies.
   *
   * Registered law: `registered("takeArrow", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanPickUp.IParams` except
   *   the handle, which the law fixes at the nock grip.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  takeArrow(
    params: IAutoMovieMotionHumanArchery.ITakeArrow,
    anchor?: string,
  ): Chain;

  /**
   * Set the arrow's nock on the bow's `nock` socket, its shaft on the bow's
   * `rest`.
   *
   * Registered law: `registered("nockArrow", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanPutDown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  nockArrow(
    params: IAutoMovieMotionHumanPutDown.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Hold the bow out in one hand on the line from the face to the target, the
   * bow arm extended.
   *
   * Registered law: `registered("presentBow", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IPresent`
   *   except the anchor, the hands, the line origin, the tip, the edge and the
   *   extension, which the preset fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  presentBow(
    params: IAutoMovieMotionHumanArchery.IPresentBow,
    anchor?: string,
  ): Chain;

  /**
   * Draw the string back to the anchor under the chin, over `presentBow`.
   *
   * Registered law: `registered("drawBow", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanOperate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  drawBow(params: IAutoMovieMotionHumanOperate.IParams, anchor?: string): Chain;

  /**
   * Release the arrow prop, or hand it off to an authored continuation at the
   * cue.
   *
   * Registered law: `registered("loose", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanRelease.IParams` and the
   *   optional `continuation`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  loose(params: IAutoMovieMotionHumanArchery.ILoose, anchor?: string): Chain;

  /**
   * Span a crossbow by its string, a straight pull with the foot in the
   * stirrup, or by its crank, to full travel.
   *
   * Registered law: `registered("spanCrossbow", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanOperate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  spanCrossbow(
    params: IAutoMovieMotionHumanOperate.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Hold the crossbow to the cheek on the line to the target.
   *
   * Registered law: `registered("presentCrossbow", params)`; not a chain
   * method.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IPresent`
   *   except the anchor.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  presentCrossbow(
    params: IAutoMovieMotionHumanArchery.IPresentCrossbow,
    anchor?: string,
  ): Chain;

  /**
   * Cue the crossbow's visible release and hand the bolt off to a continuation
   * when supplied.
   *
   * Registered law: `registered("shootCrossbow", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IWield`
   *   and the optional `continuation`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  shootCrossbow(
    params: IAutoMovieMotionHumanArchery.IShootCrossbow,
    anchor?: string,
  ): Chain;

  /**
   * Throw a held weapon (a javelin, spear, knife, grenade, stone, bottle, sling
   * stone or atlatl dart) at the target on the range the stand-off gives.
   *
   * Registered law: `registered("throwWeapon", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanThrowObjectParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  throwWeapon(
    params: IAutoMovieMotionHumanThrowObjectParams,
    anchor?: string,
  ): Chain;

  /**
   * Rope from the saddle: swing the lariat's loop overhead in time with the
   * horse's stride, throw it at a target on a moving animal and dally the rope
   * round the saddle horn.
   *
   * Registered law: `registered("lasso", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanLasso`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lasso(params: IAutoMovieMotionHumanLasso, anchor?: string): Chain;
}

/** The parameter and preset types of the family's methods. */
export namespace IAutoMovieMotionHumanArchery {
  /**
   * The parameters of `takeArrow`: the pick up without the handle, which the
   * law fixes at the nock grip.
   */
  export type ITakeArrow = Omit<IAutoMovieMotionHumanPickUp.IParams, "handle">;

  /**
   * The parameters of `presentBow`: the presentation without the anchor, hands,
   * line origin, tip, edge and extension that the bow fixes.
   */
  export type IPresentBow = Omit<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "anchor" | "hands" | "from" | "tip" | "edge" | "extended"
  >;

  /**
   * The parameters of `loose`: the release of the drawing hand, with the
   * optional authored continuation after the cue.
   */
  export interface ILoose extends IAutoMovieMotionHumanRelease.IParams {
    /**
     * The staged arrow and its animation carrier. Incompatible with `prop` or
     * `launch`.
     */
    continuation?: IAutoMovieMotionHumanLexiconArcheryParams.IContinuation;
  }

  /**
   * The parameters of `presentCrossbow`: the presentation without the anchor,
   * which the crossbow fixes at the cheek.
   */
  export type IPresentCrossbow = Omit<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "anchor"
  >;

  /**
   * The parameters of `shootCrossbow`: the crossbow's trigger and string cue,
   * with the optional authored continuation for the bolt.
   */
  export interface IShootCrossbow
    extends IAutoMovieMotionHumanWeaponPresent.IWield {
    /** The staged bolt and its animation carrier. Incompatible with `shot`. */
    continuation?: IAutoMovieMotionHumanLexiconArcheryParams.IContinuation;
  }

  /**
   * The presentation the `PRESENT_BOW` preset fixes: anchored at the face, one
   * hand, the line from the `nock` through the `rest`, the grip as the edge and
   * the bow arm extended.
   */
  export type IPresentBowPreset = Pick<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "anchor" | "hands" | "from" | "tip" | "edge" | "extended"
  >;

  /**
   * The throw the `THROW_JAVELIN` preset fixes: overarm at 33.9 degrees, the
   * shaft along its velocity.
   */
  export type IJavelinPreset = Pick<
    IAutoMovieMotionHumanThrowObjectParams,
    "style" | "angle" | "attitude"
  >;

  /**
   * The throw the `THROW_KNIFE` preset fixes: overarm, spinning whole half
   * turns to the target.
   */
  export type IKnifePreset = Pick<
    IAutoMovieMotionHumanThrowObjectParams,
    "style" | "attitude"
  >;
}
