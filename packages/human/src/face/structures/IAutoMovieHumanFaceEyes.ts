import type { IAutoMovieHumanFaceOpticalDimensions } from "./IAutoMovieHumanFaceOpticalDimensions";

/**
 * A document's independent optical dimensions for each eye.
 *
 * Each side takes the seven explicit dimensions of one authored optical core
 * (`IAutoMovieHumanFaceOpticalDimensions`). They need the basis's
 * producer-qualified optical support for that side; without it the builder
 * refuses the document by name instead of approximating a globe. Omission
 * keeps the basis's authored globes byte for byte.
 *
 * @evidence contracts/common.md#principled-implementation Both anatomical sides state complete independent seven-dimension authored optical cores, positioned through their matching producer-qualified source support rather than inferred skin morphs.
 * @evidence contracts/common.md#clear-and-simple-design The pair assigns side ownership while OpticalDimensions owns physical units and geometry meaning and source support owns pivots/placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Biometric observations do not automatically become these source geometry dimensions, absent support refuses rather than fitting a replacement globe, and optical dimensions certify no patient reconstruction.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes whole-section omission from supplied complete bilateral cores and states support/refusal/source-retention behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pair schema runs no optical construction or source placement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Independent dimension records define no optical-mesh or finish cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The document owns both scalar dimension records; no optical buffer/task is allocated by the type.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyes {
  /** Optical dimensions of the anatomical left eye. */
  left: IAutoMovieHumanFaceOpticalDimensions;

  /** Optical dimensions of the anatomical right eye. */
  right: IAutoMovieHumanFaceOpticalDimensions;
}
