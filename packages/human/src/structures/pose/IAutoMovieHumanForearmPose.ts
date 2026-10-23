import { tags } from "typia";

/** Forearm rotation from the thumb-up mid position, degrees (measured). */
export interface IAutoMovieHumanForearmPose {
  /** Pronation (palm turned down) 79.45, supination 87.8. */
  pronation?: number & tags.Minimum<-87.8> & tags.Maximum<79.45>;
}
