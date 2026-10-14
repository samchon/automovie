import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";

/**
 * Imaging of a length or angle; radiography cannot segment a 3D volume.
 *
 * @evidence contracts/common.md#principled-implementation The imaging union extends tomographic modalities with radiography only for suitable scalar measurements.
 * @evidence contracts/common.md#clear-and-simple-design Shared tomography ownership prevents duplicated CT/MRI choices across angle and length observation schemas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Radiography is not presented as a method for independent three-dimensional tissue segmentation.
 * @evidence contracts/common.md#meaningful-documentation The description explains scalar imaging scope and the volume limitation of radiographs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The modality union executes no image decoding or segmentation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Imaging method typing shares definitions rather than cached acquisition calculations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Modality metadata acquires no scanner session, decoded image or segmentation buffer.
 * @author Samchon
 */
export type AutoMovieHumanBodyImagingModality =
  | AutoMovieHumanBodyTomographicModality
  | "radiograph";
