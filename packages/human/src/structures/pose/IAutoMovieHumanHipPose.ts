import { tags } from "typia";

/** Hip joint, degrees. */
export interface IAutoMovieHumanHipPose {
  /** Flexion 132.1, extension 17.75 (measured). */
  flexion?: number & tags.Minimum<-17.75> & tags.Maximum<132.1>;

  /** Abduction 40, adduction 20 (AAOS). */
  abduction?: number & tags.Minimum<-20> & tags.Maximum<40>;

  /** External rotation 45, internal rotation 45 (recalled, Greene and Heckman 1994). */
  rotation?: number & tags.Minimum<-45> & tags.Maximum<45>;
}
