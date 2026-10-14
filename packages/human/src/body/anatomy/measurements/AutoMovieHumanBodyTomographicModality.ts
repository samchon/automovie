/**
 * CT or MRI acquisition capable of 3D tissue segmentation.
 *
 * @evidence contracts/common.md#principled-implementation The closed tomography union permits CT and MRI acquisition labels for segmented volume observations.
 * @evidence contracts/common.md#clear-and-simple-design Two modality literals provide shared vocabulary without attaching modality-specific image processing behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The vocabulary does not claim that an acquisition label proves adequate coverage or segmentation quality.
 * @evidence contracts/common.md#meaningful-documentation The declaration states three-dimensional segmentation scope while consumers retain acquisition validity responsibilities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Tomographic modality typing performs no voxel traversal or segmentation inference.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The modality declaration shares names but coordinates no equivalent acquisition processing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Tomographic labels retain no voxel buffers, scanner resources or reconstruction tasks.
 * @author Samchon
 */
export type AutoMovieHumanBodyTomographicModality = "ct" | "mri";
