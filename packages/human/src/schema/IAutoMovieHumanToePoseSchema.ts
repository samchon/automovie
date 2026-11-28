import type { IAutoMovieHumanToePose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Angles for one of the second through fifth toes, in degrees from neutral.
 * The base joint flexes and abducts. The middle and distal joints each have a
 * flexion channel.
 */
export type IAutoMovieHumanToePoseSchema = IAutoMovieHumanToePose & {
  /** Metatarsophalangeal flexion 40, extension 40. */
  mtpFlexion?: number & tags.Minimum<-40> & tags.Maximum<40>;

  /** Metatarsophalangeal abduction away from the second toe's line (the second toe: toward the fifth), 10 each way. */
  mtpAbduction?: number & tags.Minimum<-10> & tags.Maximum<10>;

  /** Proximal interphalangeal flexion, 0 to 35. */
  pipFlexion?: number & tags.Minimum<0> & tags.Maximum<35>;

  /** Distal interphalangeal flexion, 0 to 60. */
  dipFlexion?: number & tags.Minimum<0> & tags.Maximum<60>;
};
