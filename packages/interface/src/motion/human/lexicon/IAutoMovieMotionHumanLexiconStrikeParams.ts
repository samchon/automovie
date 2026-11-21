import type { IAutoMovieMotionHumanCloseStrike } from "../striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanFootStrike } from "../striking/IAutoMovieMotionHumanFootStrike";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";

/**
 * Open parameters of the strike lexicon family, keyed by each runtime export name: the named punches, kicks and knees of #3362.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The strike family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the strike row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconStrikeParams {
  /** A jab: the lead straight. */
  jab: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A cross: the rear straight. */
  cross: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A hook with the lead hand. */
  leadHook: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A hook with the rear hand. */
  rearHook: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** An uppercut with the lead hand. */
  leadUppercut: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** An uppercut with the rear hand. */
  rearUppercut: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A backfist with the lead hand: the back of the fist swung out across the line. */
  backfist: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A hammerfist with the rear hand: the fist's little-finger edge brought down. */
  hammerfist: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A palm-heel strike with the rear hand: the heel of the open palm driven along the line. */
  palmHeel: Omit<IAutoMovieMotionHumanPunch.IParams, "technique" | "hand">;

  /** A horizontal elbow with the rear arm, swept across the line. */
  horizontalElbow: Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "arm"
  >;

  /** A rising elbow with the rear arm, brought up under the target. */
  risingElbow: Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "arm"
  >;

  /** A descending elbow with the rear arm, brought down onto the target. */
  descendingElbow: Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "arm"
  >;

  /** A spinning elbow: a whole turn on the lead ball, the rear elbow landing as it comes past. */
  spinningElbow: Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "arm"
  >;

  /** A spinning backfist: a whole turn on the lead ball, the back of the rear fist landing as it comes past. */
  spinningBackfist: Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "arm"
  >;

  /** A headbutt: the forehead driven onto the target, the hands on a person's neck. */
  headbutt: Omit<IAutoMovieMotionHumanCloseStrike.IParams, "technique" | "arm">;

  /** A side kick with the lead leg: the heel driven along the line, the hip turned over. */
  sideKick: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A back kick with the rear leg: turned away, the heel thrust behind. */
  backKick: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A hook kick with the lead leg: the heel swept toward the kicker's own side. */
  hookKick: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A crescent kick with the rear leg: the sole swept away from the kicker's side. */
  crescentKick: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** An axe kick with the rear leg: the heel brought down from above. */
  axeKick: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A stomp with the rear leg: the sole driven straight down onto a floor-level target. */
  stomp: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A leg sweep with the lead leg: the sole reaping the partner's support ankle. */
  legSweep: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A spinning hook kick with the rear leg: a whole turn, then the heel swept across. */
  spinningHookKick: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A jumping side kick with the lead leg: off the floor at the contact. */
  jumpingSideKick: Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    "technique" | "leg" | "spin" | "jump"
  >;

  /** A rear round kick. */
  roundKick: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A round kick with the lead leg. */
  switchKick: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A push kick with the lead foot. */
  pushKick: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A push kick with the rear foot. */
  teep: Omit<IAutoMovieMotionHumanKick.IParams, "technique" | "leg">;

  /** A knee with the lead leg. */
  leadKnee: Omit<IAutoMovieMotionHumanKnee.IParams, "leg">;

  /** A knee with the rear leg. */
  rearKnee: Omit<IAutoMovieMotionHumanKnee.IParams, "leg">;
}
