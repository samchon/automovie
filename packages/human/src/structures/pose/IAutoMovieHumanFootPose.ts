import { tags } from "typia";

import type { IAutoMovieHumanHalluxPose } from "./IAutoMovieHumanHalluxPose";
import type { IAutoMovieHumanToePose } from "./IAutoMovieHumanToePose";

/** Hindfoot and midfoot below the ankle, then the toes from the hallux to the fifth, degrees. */
export interface IAutoMovieHumanFootPose {
  /** Subtalar inversion (sole turned inward) 5, eversion 5 (recalled, Greene and Heckman 1994 hindfoot). */
  subtalarInversion?: number & tags.Minimum<-5> & tags.Maximum<5>;

  /** Transverse tarsal forefoot supination 35, pronation 15 (recalled, Greene and Heckman 1994 forefoot). */
  midfootSupination?: number & tags.Minimum<-15> & tags.Maximum<35>;

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
