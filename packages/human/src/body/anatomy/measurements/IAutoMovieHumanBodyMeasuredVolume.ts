import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";
import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";

/**
 * Directly segmented bone or tissue volume in millilitres.
 *
 * @evidence contracts/common.md#principled-implementation Segmented millilitres retain CT/MRI and posture provenance for exactly one named tissue and side.
 * @evidence contracts/common.md#clear-and-simple-design The common measured-volume owner keeps acquisition fields separate from regional tissue identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Radiographic projection cannot stand in for three-dimensional segmentation or an invented compartment split.
 * @evidence contracts/common.md#meaningful-documentation Comments describe named-tissue exclusivity, millilitre quantity, tomographic acquisition and unknown error.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Measured-volume typing performs no voxel scan, boundary extraction or integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The volume observation interface coordinates no equivalent segmentation work between scans.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Segmented-volume scalars retain no original voxels, mask arrays or scanner sessions.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredVolume {
  /** A real 3D image segmentation rather than a fictional target. */
  readonly kind: "observed";

  /** Volume of exactly the named tissue and side, excluding other depots. */
  readonly millilitres: number;

  /** A tomographic acquisition; a plain radiograph cannot provide this. */
  readonly modality: AutoMovieHumanBodyTomographicModality;

  /** Supine/prone volumes do not imply the same standing skin outline. */
  readonly acquisitionPosture: AutoMovieHumanBodyAcquisitionPosture;

  /** Absent when segmentation error is not quantified. */
  readonly uncertaintyMillilitres?: number;
}
