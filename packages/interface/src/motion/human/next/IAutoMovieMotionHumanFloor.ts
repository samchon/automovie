import type { IAutoMovieMotionHumanCrabWalk } from "../floor/IAutoMovieMotionHumanCrabWalk";
import type { IAutoMovieMotionHumanCrawl } from "../floor/IAutoMovieMotionHumanCrawl";
import type { IAutoMovieMotionHumanDive } from "../floor/IAutoMovieMotionHumanDive";
import type { IAutoMovieMotionHumanGetUp } from "../floor/IAutoMovieMotionHumanGetUp";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanLieOnSurface } from "../floor/IAutoMovieMotionHumanLieOnSurface";
import type { IAutoMovieMotionHumanLogRoll } from "../floor/IAutoMovieMotionHumanLogRoll";
import type { IAutoMovieMotionHumanRoll } from "../floor/IAutoMovieMotionHumanRoll";
import type { IAutoMovieMotionHumanTurnOver } from "../floor/IAutoMovieMotionHumanTurnOver";

/**
 * The actions on and from the floor: lying down, rolling, crawling and getting up.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Floor family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Floor laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFloor<Chain> {
  /**
   * Lying down on the floor from standing into a position: supine, prone, or on the left or right side.
   *
   * @param params The `position`, `hold` and `manner` of `IAutoMovieMotionHumanLieDown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  lieDown(params: IAutoMovieMotionHumanLieDown.IParams, anchor?: string): Chain;

  /**
   * Getting up from the floor to standing: from lying on the back or the front, from the hands and knees or crouched, as a crawl ends.
   *
   * @param params The `pattern`, `lead` and `manner` of `IAutoMovieMotionHumanGetUp.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  getUp(params: IAutoMovieMotionHumanGetUp.IParams, anchor?: string): Chain;

  /**
   * A forward or backward roll on the floor: the body crouches into a tuck over its feet, rolls once round over its back as a ball rolls, without flight, and rises from the tuck on its feet where the roll has carried it.
   *
   * @param params The `direction` of `IAutoMovieMotionHumanRoll.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  roll(params: IAutoMovieMotionHumanRoll.IParams, anchor?: string): Chain;

  /**
   * Crawling on hands and knees along the heading, from standing: the body gets down onto hands and knees, then crawls a number of cycles in the diagonal pattern, each hand moving with the opposite knee like a quadruped's trot (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
   *
   * @param params The `balance`, `kind`, `cycles` and `manner` of `IAutoMovieMotionHumanCrawl.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  crawl(params: IAutoMovieMotionHumanCrawl.IParams, anchor?: string): Chain;

  /**
   * A supine quadrupedal crawl, the crab walk of horror films: from sitting, the hands plant behind the hips and the pelvis lifts, and the body travels on its hands and feet with the chest up, feet first or head first.
   *
   * @param params The `to`, `lead`, `backbend` and `height` of `IAutoMovieMotionHumanCrabWalk.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  crabWalk(
    params: IAutoMovieMotionHumanCrabWalk.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A fall onto the floor on purpose from a stance: a goalkeeper's dive to the side, or a sliding tackle forward on the hip.
   *
   * @param params The `kind` and `side` of `IAutoMovieMotionHumanDive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  dive(params: IAutoMovieMotionHumanDive.IParams, anchor?: string): Chain;

  /**
   * Lying down on, or sitting up from, a raised support such as a bed or a sofa: from sitting on its long edge the trunk lowers toward the head end while the legs swing up, then the body rolls onto the back; with `rise` the reverse.
   *
   * @param params The `prop`, `surface`, `edge`, `position`, `rise`, `hold` and `manner` of `IAutoMovieMotionHumanLieOnSurface`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  lieOnSurface(
    params: IAutoMovieMotionHumanLieOnSurface,
    anchor?: string,
  ): Chain;

  /**
   * Turning over while lying, about the body's long axis, between the back, either side and the front, on the floor or on a bed's surface.
   *
   * @param params The `to`, `via`, `on`, `hold` and `manner` of `IAutoMovieMotionHumanTurnOver`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  turnOver(params: IAutoMovieMotionHumanTurnOver, anchor?: string): Chain;

  /**
   * A log roll across the floor: the lying body, straight with the arms overhead, rolls about its long axis toward one side for a number of half turns or to a named place, ending on the back or the front.
   *
   * @param params The `toward`, `halfTurns`, `to`, `end` and `manner` of `IAutoMovieMotionHumanLogRoll`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  logRoll(params: IAutoMovieMotionHumanLogRoll, anchor?: string): Chain;
}

/**
 * The parameter types of the Floor methods.
 */
export namespace IAutoMovieMotionHumanFloor {
  /**
   * The kind and hold that a named lying or sitting down fixes: the `kind` and `hold` of `lieDown`. Spread into `lieDown`'s parameters; `AutoMovieMotionHumanFloor.SIT_ON_FLOOR`, `SIT_CROSS_LEGGED`, `SIT_SIDEWAYS` and `LIE_STILL` are its data and the rows of the same names read them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it, how it is applied and where the members' meanings are.
   * @evidence contracts/development/design.md#principled-representation The lieDown law's own members, so a preset fixes only the values its row means and the law keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `lieDown` owns the members' meanings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type names the pick of `lieDown`'s own members and redefines none.
   */
  export type ILieDownPreset = Pick<
    IAutoMovieMotionHumanLieDown.IParams,
    "kind" | "hold"
  >;
}
