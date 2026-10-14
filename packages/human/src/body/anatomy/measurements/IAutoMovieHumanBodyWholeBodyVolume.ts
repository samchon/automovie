import type { IAutoMovieHumanBodyMeasuredVolume } from "./IAutoMovieHumanBodyMeasuredVolume";

/**
 * Target whole-body tissue volume or tomography with complete body coverage.
 *
 * An L3 slice, abdomen-only CT or limb MRI is not a whole-body volume even when it contains the same tissue label. The record declares full anatomical coverage. This literal alone cannot verify scan bytes or actual coverage; the observation's owner must establish those before using a measured total.
 *
 * @evidence contracts/common.md#principled-implementation Whole-body volume distinguishes desired totals from measured tissue volumes declaring complete anatomical coverage.
 * @evidence contracts/common.md#clear-and-simple-design The measured-volume intersection owns only the coverage assertion while shared provenance owns acquisition fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A coverage literal cannot verify raw scan bytes; partial scans cannot be silently used as complete-body totals.
 * @evidence contracts/common.md#meaningful-documentation Prose explains partial-scan exclusions and external coverage responsibility; members give millilitre and declaration semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Whole-body volume typing executes no coverage analysis or voxel integration algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This total-volume schema coordinates no shared segmentation or scan-coverage computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The whole-body record retains no imaging volume, mask population or acquisition process resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodyWholeBodyVolume =
  | {
      /** Desired complete-body material total rather than a measured acquisition. */
      readonly kind: "target";

      /** Target volume in millilitres for one whole-body tissue compartment. */
      readonly millilitres: number;
    }
  | (IAutoMovieHumanBodyMeasuredVolume & {
      /** Assertion of complete-body coverage whose raw observation must be established externally. */
      readonly coverage: "whole-body";
    });
