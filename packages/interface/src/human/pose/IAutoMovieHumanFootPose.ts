import type { IAutoMovieHumanHalluxPose } from "./IAutoMovieHumanHalluxPose";
import type { IAutoMovieHumanToePose } from "./IAutoMovieHumanToePose";

/** Hindfoot and midfoot below the ankle, then the toes from the hallux to the fifth, degrees.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Hindfoot and midfoot below the ankle, then the toes from the hallux to the fifth, degrees.
 * @evidence contracts/development/design.md#principled-representation `subtalarInversion`: Subtalar inversion (sole turned inward) 5, eversion 5 (recalled, Greene and Heckman 1994 hindfoot). `midfootSupination`: Transverse tarsal forefoot supination 35, pronation 15 (recalled, Greene and Heckman 1994 forefoot). `hallux`: Big toe.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootPose is the canonical exchange used by IAutoMovieHumanFootPoseSchema, IAutoMovieHumanLegPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `subtalarInversion`: Subtalar inversion (sole turned inward) 5, eversion 5 (recalled, Greene and Heckman 1994 hindfoot). `midfootSupination`: Transverse tarsal forefoot supination 35, pronation 15 (recalled, Greene and Heckman 1994 forefoot). `hallux`: Big toe. `second`: Second toe. `third`: Third toe. `fourth`: Fourth toe. `fifth`: Fifth toe.
 */
export interface IAutoMovieHumanFootPose {
  /** Subtalar inversion (sole turned inward) 5, eversion 5 (recalled, Greene and Heckman 1994 hindfoot). Schema constraints: Minimum: -5; Maximum: 5; retained by Human's schema refinement. */
  subtalarInversion?: number;

  /** Transverse tarsal forefoot supination 35, pronation 15 (recalled, Greene and Heckman 1994 forefoot). Schema constraints: Minimum: -15; Maximum: 35; retained by Human's schema refinement. */
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
