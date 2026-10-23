import { tags } from "typia";

/** Elbow hinge, degrees (measured). */
export interface IAutoMovieHumanElbowPose {
  /** Flexion 147.3, hyperextension 2.75. */
  flexion?: number & tags.Minimum<-2.75> & tags.Maximum<147.3>;
}
