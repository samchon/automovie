import type { IAutoMovieHumanLumbarPose } from "./IAutoMovieHumanLumbarPose";
import type { IAutoMovieHumanThoracicPose } from "./IAutoMovieHumanThoracicPose";

/**
 * The thoracic and lumbar spine, top to bottom; the cervical spine belongs to the neck. Positive flexion bends forward (negative is extension), positive lateral flexion bends toward the person's left and positive rotation turns the front toward the left.
 *
 * Thoracolumbar totals flexion 80, extension 25, lateral flexion 35 and rotation 45 (recalled, Greene and Heckman 1994), split between the two regions by convention.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The thoracic and lumbar spine, top to bottom; the cervical spine belongs to the neck.
 * @evidence contracts/development/design.md#principled-representation `thoracic`: T1 to T12. `lumbar`: L1 to S1.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSpinePose is the canonical exchange used by IAutoMovieHumanSpinePoseSchema, IAutoMovieHumanPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `thoracic`: T1 to T12. `lumbar`: L1 to S1.
 */
export interface IAutoMovieHumanSpinePose {
  /** T1 to T12. */
  thoracic?: IAutoMovieHumanThoracicPose;

  /** L1 to S1. */
  lumbar?: IAutoMovieHumanLumbarPose;
}
