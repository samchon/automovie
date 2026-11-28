import type { IAutoMovieHumanEyePose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * One eye's gaze offsets from anatomical neutral, in degrees. Positive
 * vertical gaze looks up. Positive horizontal gaze looks toward the person's
 * left.
 */
export type IAutoMovieHumanEyePoseSchema = IAutoMovieHumanEyePose & {
  /** Vertical gaze: positive up, negative down, 30 each way. */
  vertical?: number & tags.Minimum<-30> & tags.Maximum<30>;

  /** Horizontal gaze: positive toward the person's left, negative toward the right, 45 each way. */
  horizontal?: number & tags.Minimum<-45> & tags.Maximum<45>;
};
