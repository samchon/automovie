import { tags } from "typia";

/** Big toe proximal to distal, degrees. Flexion curls the toe toward the sole; negative flexion is extension, lifting it. */
export interface IAutoMovieHumanHalluxPose {
  /** Metatarsophalangeal flexion 45, extension 70 (AAOS). */
  mtpFlexion?: number & tags.Minimum<-70> & tags.Maximum<45>;

  /** Metatarsophalangeal abduction away from the second toe, 15 each way (convention). */
  mtpAbduction?: number & tags.Minimum<-15> & tags.Maximum<15>;

  /** Interphalangeal flexion, 0 to 90 (recalled, Greene and Heckman 1994). */
  ipFlexion?: number & tags.Minimum<0> & tags.Maximum<90>;
}
