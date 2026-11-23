import type { IAutoMovieMotionHumanStrike } from "../next/IAutoMovieMotionHumanStrike";

/**
 * Open parameters of the strike lexicon family, keyed by each runtime export
 * name: the named punches, kicks and knees.
 */
export interface IAutoMovieMotionHumanLexiconStrikeParams {
  /** A jab: the lead straight. */
  jab: IAutoMovieMotionHumanStrike.IPunchRow;

  /** A cross: the rear straight. */
  cross: IAutoMovieMotionHumanStrike.IPunchRow;

  /** A hook with the lead hand. */
  leadHook: IAutoMovieMotionHumanStrike.IPunchRow;

  /** A hook with the rear hand. */
  rearHook: IAutoMovieMotionHumanStrike.IPunchRow;

  /** An uppercut with the lead hand. */
  leadUppercut: IAutoMovieMotionHumanStrike.IPunchRow;

  /** An uppercut with the rear hand. */
  rearUppercut: IAutoMovieMotionHumanStrike.IPunchRow;

  /**
   * A wing chun chain punch with the lead hand: a vertical fist along the
   * centreline.
   */
  chainPunch: IAutoMovieMotionHumanStrike.IPunchRow;

  /** A wing chun chain punch with the rear hand. */
  rearChainPunch: IAutoMovieMotionHumanStrike.IPunchRow;

  /**
   * Capoeira's meia-lua de frente: the rear leg's straight sweep inward across
   * the front.
   */
  meiaLuaDeFrente: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /**
   * Capoeira's armada: a whole turn, then the rear leg's straight sweep
   * outward.
   */
  armada: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /**
   * A backfist with the lead hand: the back of the fist swung out across the
   * line.
   */
  backfist: IAutoMovieMotionHumanStrike.IPunchRow;

  /**
   * A hammerfist with the rear hand: the fist's little-finger edge brought
   * down.
   */
  hammerfist: IAutoMovieMotionHumanStrike.IPunchRow;

  /**
   * A palm-heel strike with the rear hand: the heel of the open palm driven
   * along the line.
   */
  palmHeel: IAutoMovieMotionHumanStrike.IPunchRow;

  /** A horizontal elbow with the rear arm, swept across the line. */
  horizontalElbow: IAutoMovieMotionHumanStrike.ICloseStrikeRow;

  /** A rising elbow with the rear arm, brought up under the target. */
  risingElbow: IAutoMovieMotionHumanStrike.ICloseStrikeRow;

  /** A descending elbow with the rear arm, brought down onto the target. */
  descendingElbow: IAutoMovieMotionHumanStrike.ICloseStrikeRow;

  /**
   * A spinning elbow: a whole turn on the lead ball, the rear elbow landing as
   * it comes past.
   */
  spinningElbow: IAutoMovieMotionHumanStrike.ICloseStrikeRow;

  /**
   * A spinning backfist: a whole turn on the lead ball, the back of the rear
   * fist landing as it comes past.
   */
  spinningBackfist: IAutoMovieMotionHumanStrike.ICloseStrikeRow;

  /**
   * A headbutt: the forehead driven onto the target, the hands on a person's
   * neck.
   */
  headbutt: IAutoMovieMotionHumanStrike.ICloseStrikeRow;

  /**
   * A side kick with the lead leg: the heel driven along the line, the hip
   * turned over.
   */
  sideKick: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /** A back kick with the rear leg: turned away, the heel thrust behind. */
  backKick: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /** A hook kick with the lead leg: the heel swept toward the kicker's own side. */
  hookKick: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /**
   * A crescent kick with the rear leg: the sole swept away from the kicker's
   * side.
   */
  crescentKick: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /** An axe kick with the rear leg: the heel brought down from above. */
  axeKick: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /**
   * A stomp with the rear leg: the sole driven straight down onto a floor-level
   * target.
   */
  stomp: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /**
   * A leg sweep with the lead leg: the sole reaping the partner's support
   * ankle.
   */
  legSweep: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /**
   * A spinning hook kick with the rear leg: a whole turn, then the heel swept
   * across.
   */
  spinningHookKick: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /** A jumping side kick with the lead leg: off the floor at the contact. */
  jumpingSideKick: IAutoMovieMotionHumanStrike.IFootStrikeRow;

  /** A rear round kick. */
  roundKick: IAutoMovieMotionHumanStrike.IKickRow;

  /** A round kick with the lead leg. */
  switchKick: IAutoMovieMotionHumanStrike.IKickRow;

  /** A push kick with the lead foot. */
  pushKick: IAutoMovieMotionHumanStrike.IKickRow;

  /** A push kick with the rear foot. */
  teep: IAutoMovieMotionHumanStrike.IKickRow;

  /** A knee with the lead leg. */
  leadKnee: IAutoMovieMotionHumanStrike.IKneeRow;

  /** A knee with the rear leg. */
  rearKnee: IAutoMovieMotionHumanStrike.IKneeRow;
}
