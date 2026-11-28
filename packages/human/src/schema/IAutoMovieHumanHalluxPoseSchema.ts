import type { IAutoMovieHumanHalluxPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Big toe angles in degrees from neutral. The base joint flexes and moves away
 * from the second toe. The interphalangeal joint has its own flexion channel.
 */
export type IAutoMovieHumanHalluxPoseSchema = IAutoMovieHumanHalluxPose & {
  /** Metatarsophalangeal flexion 45, extension 70 (AAOS). */
  mtpFlexion?: number & tags.Minimum<-70> & tags.Maximum<45>;

  /** Metatarsophalangeal abduction away from the second toe, 15 each way (convention). */
  mtpAbduction?: number & tags.Minimum<-15> & tags.Maximum<15>;

  /** Interphalangeal flexion, 0 to 90 (recalled, Greene and Heckman 1994). */
  ipFlexion?: number & tags.Minimum<0> & tags.Maximum<90>;
};
