import type { IAutoMovieHumanBodyMeasuredAngle } from "./IAutoMovieHumanBodyMeasuredAngle";

/**
 * A target clinical angle or an imaged angle between the same axes.
 *
 * @evidence contracts/common.md#principled-implementation Target degrees and measured-angle provenance form distinct branches over the owning anatomical axes.
 * @evidence contracts/common.md#clear-and-simple-design The angle union delegates observed acquisition fields to the existing measured-angle contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A desired angle does not acquire fabricated imaging method or observation uncertainty.
 * @evidence contracts/common.md#meaningful-documentation Comments identify target degree units and the same-axis requirement for observed quantities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Anatomical angle typing executes no axis fitting or trigonometric reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The angle union does not coordinate repeated imaging-axis calculations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Angle records acquire no fitted-axis buffers or imaging process resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalAngle =
  | {
      /** Desired anatomical angle rather than an imaging observation. */
      readonly kind: "target";

      /** Target angle in degrees between the owning anatomical axes. */
      readonly degrees: number;
    }
  | IAutoMovieHumanBodyMeasuredAngle;
