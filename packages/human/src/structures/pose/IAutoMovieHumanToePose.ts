import { tags } from "typia";

/** One lesser toe (second to fifth) proximal to distal, degrees (recalled, Greene and Heckman 1994; abduction a convention). Flexion curls the toe toward the sole; negative flexion is extension. */
export interface IAutoMovieHumanToePose {
  /** Metatarsophalangeal flexion 40, extension 40. */
  mtpFlexion?: number & tags.Minimum<-40> & tags.Maximum<40>;

  /** Metatarsophalangeal abduction away from the second toe's line (the second toe: toward the fifth), 10 each way. */
  mtpAbduction?: number & tags.Minimum<-10> & tags.Maximum<10>;

  /** Proximal interphalangeal flexion, 0 to 35. */
  pipFlexion?: number & tags.Minimum<0> & tags.Maximum<35>;

  /** Distal interphalangeal flexion, 0 to 60. */
  dipFlexion?: number & tags.Minimum<0> & tags.Maximum<60>;
}
