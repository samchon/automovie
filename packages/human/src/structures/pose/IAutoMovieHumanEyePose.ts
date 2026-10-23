import { tags } from "typia";

/** Gaze of one eye from straight ahead, degrees. The bounds are the engine's conventional eye range (convention). */
export interface IAutoMovieHumanEyePose {
  /** Vertical gaze: positive up, negative down, 30 each way. */
  vertical?: number & tags.Minimum<-30> & tags.Maximum<30>;

  /** Horizontal gaze: positive toward the person's left, negative toward the right, 45 each way. */
  horizontal?: number & tags.Minimum<-45> & tags.Maximum<45>;
}
