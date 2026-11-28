import type { IAutoMovieHumanFootPose } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanHalluxPoseSchema } from "./IAutoMovieHumanHalluxPoseSchema";
import type { IAutoMovieHumanToePoseSchema } from "./IAutoMovieHumanToePoseSchema";

/**
 * Hindfoot, midfoot and toe angles for one foot, in degrees from anatomical
 * neutral. The two foot angles are positive for subtalar inversion and midfoot
 * supination. Each toe can be supplied independently.
 */
export type IAutoMovieHumanFootPoseSchema = IAutoMovieHumanFootPose & {
  /** Subtalar inversion (sole turned inward) 5, eversion 5 (recalled, Greene and Heckman 1994 hindfoot). */
  subtalarInversion?: number & tags.Minimum<-5> & tags.Maximum<5>;

  /** Transverse tarsal forefoot supination 35, pronation 15 (recalled, Greene and Heckman 1994 forefoot). */
  midfootSupination?: number & tags.Minimum<-15> & tags.Maximum<35>;

  /** Big toe. */
  hallux?: IAutoMovieHumanHalluxPoseSchema;

  /** Second toe. */
  second?: IAutoMovieHumanToePoseSchema;

  /** Third toe. */
  third?: IAutoMovieHumanToePoseSchema;

  /** Fourth toe. */
  fourth?: IAutoMovieHumanToePoseSchema;

  /** Fifth toe. */
  fifth?: IAutoMovieHumanToePoseSchema;
};
