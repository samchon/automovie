import type { IAutoMovieHumanHalluxPose } from "./IAutoMovieHumanHalluxPose";
import type { IAutoMovieHumanToePose } from "./IAutoMovieHumanToePose";

/**
 * Hindfoot and midfoot below the ankle, then the toes from the hallux to the
 * fifth, degrees.
 */
export interface IAutoMovieHumanFootPose {
  /**
   * Subtalar inversion (sole turned inward) 5, eversion 5 (recalled, Greene and
   * Heckman 1994 hindfoot). Schema constraints: Minimum: -5; Maximum: 5;
   * retained by Human's schema refinement.
   */
  subtalarInversion?: number;

  /**
   * Transverse tarsal forefoot supination 35, pronation 15 (recalled, Greene
   * and Heckman 1994 forefoot). Schema constraints: Minimum: -15; Maximum: 35;
   * retained by Human's schema refinement.
   */
  midfootSupination?: number;

  /** Big toe. */
  hallux?: IAutoMovieHumanHalluxPose;

  /** Second toe. */
  second?: IAutoMovieHumanToePose;

  /** Third toe. */
  third?: IAutoMovieHumanToePose;

  /** Fourth toe. */
  fourth?: IAutoMovieHumanToePose;

  /** Fifth toe. */
  fifth?: IAutoMovieHumanToePose;
}
