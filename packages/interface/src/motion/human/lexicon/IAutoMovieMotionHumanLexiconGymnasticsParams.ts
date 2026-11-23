import type { IAutoMovieMotionHumanJuggle } from "../exercise/IAutoMovieMotionHumanJuggle";
import type { IAutoMovieMotionHumanLineWalk } from "../exercise/IAutoMovieMotionHumanLineWalk";
import type { IAutoMovieMotionHumanStiltWalk } from "../exercise/IAutoMovieMotionHumanStiltWalk";
import type { IAutoMovieMotionHumanTrampoline } from "../exercise/IAutoMovieMotionHumanTrampoline";
import type { IAutoMovieMotionHumanFieldThrow } from "../sport/IAutoMovieMotionHumanFieldThrow";
import type { IAutoMovieMotionHumanHandspring } from "../sport/IAutoMovieMotionHumanHandspring";
import type { IAutoMovieMotionHumanHighJump } from "../sport/IAutoMovieMotionHumanHighJump";
import type { IAutoMovieMotionHumanHorizontalJump } from "../sport/IAutoMovieMotionHumanHorizontalJump";
import type { IAutoMovieMotionHumanHurdleClear } from "../sport/IAutoMovieMotionHumanHurdleClear";
import type { IAutoMovieMotionHumanPoleVault } from "../sport/IAutoMovieMotionHumanPoleVault";
import type { IAutoMovieMotionHumanRoundOff } from "../sport/IAutoMovieMotionHumanRoundOff";
import type { IAutoMovieMotionHumanSquatVault } from "../sport/IAutoMovieMotionHumanSquatVault";
import type { IAutoMovieMotionHumanVault } from "../sport/IAutoMovieMotionHumanVault";

/**
 * Open parameters of the gymnastics lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconGymnasticsParams {
  /** A round-off leading with the left hand, landing on both feet facing back. */
  roundOffLeft: Omit<IAutoMovieMotionHumanRoundOff.IParams, "lead">;

  /** A round-off leading with the right hand. */
  roundOffRight: Omit<IAutoMovieMotionHumanRoundOff.IParams, "lead">;

  /**
   * A front handspring on the floor, lunging on the left leg; the composition
   * may lead with the right.
   */
  frontHandspring: IAutoMovieMotionHumanHandspring.IParams;

  /**
   * A handspring vault: the hands on the top of the prop the composition names
   * as `on`.
   */
  handspringVault: IAutoMovieMotionHumanVault.IParams;

  /**
   * A two-hand box vault: the hands on the near edge of the top of the box the
   * composition names as `on`, the body tucked over them and flying to land
   * beyond its far edge.
   */
  boxVault: IAutoMovieMotionHumanSquatVault.IParams;

  /** A Fosbury flop over the bar the composition sets, onto its landing place. */
  fosburyFlop: IAutoMovieMotionHumanHighJump.IParams;

  /** A vault on the pole the hand holds, out of a run. */
  vaultOnPole: IAutoMovieMotionHumanPoleVault.IParams;

  /**
   * A long jump out of a run into the sand of the pit the composition names, to
   * the distance it gives.
   */
  longJump: IAutoMovieMotionHumanHorizontalJump.IParams;

  /**
   * A hurdle cleared out of a run, landing on the lead foot for the run to take
   * the stride on.
   */
  hurdleClear: IAutoMovieMotionHumanHurdleClear.IParams;

  /**
   * A shot, discus or hammer thrown from a circle, or a javelin thrown out of a
   * run, to the distance the composition gives.
   */
  fieldThrow: IAutoMovieMotionHumanFieldThrow.IParams;

  /** A walk heel to toe along a beam or a rope, arms out for balance. */
  lineWalk: IAutoMovieMotionHumanLineWalk.IParams;

  /** Toss juggling: a cascade or a shower. */
  juggling: IAutoMovieMotionHumanJuggle.IParams;

  /** A walk on stilts. */
  stilts: IAutoMovieMotionHumanStiltWalk.IParams;

  /** Bouncing on a trampoline. */
  trampoline: IAutoMovieMotionHumanTrampoline.IParams;
}
