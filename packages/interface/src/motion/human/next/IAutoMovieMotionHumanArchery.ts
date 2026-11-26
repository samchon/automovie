import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanLexiconArcheryParams } from "../lexicon/IAutoMovieMotionHumanLexiconArcheryParams";
import type { IAutoMovieMotionHumanWeaponPresent } from "../lexicon/IAutoMovieMotionHumanWeaponPresent";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * Authoring inputs and preset types for archery operations. The loose and
 * crossbow-shot inputs retain their authored animation-carrier continuations.
 */
/** Authoring parameters and preset types for archery operations. */
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
