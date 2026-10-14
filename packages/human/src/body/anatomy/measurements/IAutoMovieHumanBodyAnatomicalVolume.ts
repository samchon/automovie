import type { IAutoMovieHumanBodyMeasuredVolume } from "./IAutoMovieHumanBodyMeasuredVolume";

/**
 * A target bone/tissue volume or a direct CT/MRI segmentation. Neither scalar uniquely determines that tissue's 3D boundary or attachment.
 *
 * @evidence contracts/common.md#principled-implementation Target millilitres and measured segmentation provenance remain separate representations of an owned tissue volume.
 * @evidence contracts/common.md#clear-and-simple-design Observed-volume details belong to the shared measured-volume contract rather than a duplicated field collection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A volume scalar cannot substitute for individual boundaries, attachment geometry or a generated anatomical surface.
 * @evidence contracts/common.md#meaningful-documentation Comments give millilitre units and explain the unresolved three-dimensional shape and attachment limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Anatomical volume typing performs no tetrahedral integration or voxel segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The volume union coordinates no equivalent tissue-integration results across body requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Volume metadata acquires no voxel arrays, generated boundary buffers or scanner handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalVolume =
  | {
      /** Desired tissue volume rather than a segmented observation. */
      readonly kind: "target";

      /** Target material volume in millilitres for the owning tissue. */
      readonly millilitres: number;
    }
  | IAutoMovieHumanBodyMeasuredVolume;
