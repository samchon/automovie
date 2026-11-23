import type { IAutoMovieHumanLumbarPose } from "./IAutoMovieHumanLumbarPose";
import type { IAutoMovieHumanThoracicPose } from "./IAutoMovieHumanThoracicPose";

/**
 * The thoracic and lumbar spine, top to bottom; the cervical spine belongs to the neck. Positive flexion bends forward (negative is extension), positive lateral flexion bends toward the person's left and positive rotation turns the front toward the left.
 *
 * Thoracolumbar totals flexion 80, extension 25, lateral flexion 35 and rotation 45 (recalled, Greene and Heckman 1994), split between the two regions by convention.
 */
export interface IAutoMovieHumanSpinePose {
  /** T1 to T12. */
  thoracic?: IAutoMovieHumanThoracicPose;

  /** L1 to S1. */
  lumbar?: IAutoMovieHumanLumbarPose;
}
