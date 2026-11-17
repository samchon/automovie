import type { IAutoMovieHumanFootPose } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanHalluxPoseSchema } from "./IAutoMovieHumanHalluxPoseSchema";
import type { IAutoMovieHumanToePoseSchema } from "./IAutoMovieHumanToePoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanFootPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
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
