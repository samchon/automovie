import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";
import type { IAutoMovieHumanBodyMeasuredAngle } from "./IAutoMovieHumanBodyMeasuredAngle";

/**
 * A 3D bone-axis angle or a fictional target of that same angle.
 *
 * Femoral neck anteversion compares an axial neck direction with the condylar frame; a single planar radiograph cannot recover both 3D axes. CT and MRI use both proximal neck and distal condylar views in the direct comparison by Hesham et al. 2017, doi:10.1097/BPO.0000000000000712.
 *
 * @evidence contracts/common.md#principled-implementation The target/observed union narrows measured bone-axis angles to CT/MRI for the required three-dimensional context.
 * @evidence contracts/common.md#clear-and-simple-design Observed-angle fields are reused by intersection, with tomography restriction owned by this specialized quantity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A single planar projection is not promoted to a uniquely known three-dimensional neck/condylar relationship.
 * @evidence contracts/common.md#meaningful-documentation Prose names both axial frames and the read CT/MRI comparison; members explain degree units and modality restriction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Tomographic-angle typing performs no three-dimensional axis reconstruction or version calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The angle specialization shares definitions rather than evaluated proximal/distal frame fits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The tomographic angle contract owns no image stack, fitted frame buffers or imaging tasks.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTomographicAngle =
  | {
      /** Desired three-dimensional anatomical angle rather than an acquisition. */
      readonly kind: "target";

      /** Target angle in degrees between the owning three-dimensional bone axes. */
      readonly degrees: number;
    }
  | (IAutoMovieHumanBodyMeasuredAngle & {
      /** CT or MRI acquisition; projected radiography is excluded for this quantity. */
      readonly modality: AutoMovieHumanBodyTomographicModality;
    });
