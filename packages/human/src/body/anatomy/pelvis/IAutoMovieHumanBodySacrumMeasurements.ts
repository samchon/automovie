import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed midline sacrum volume shared by both pelvic sides.
 *
 * It is one bone, not a left/right duplicate. The posterior sacral surface participates in gluteus maximus origin; a segmented volume does not locate that attachment or reconstruct the sacral surface. Geometry and attachment landmarks are generated state rather than authored coordinates.
 *
 * @evidence contracts/common.md#principled-implementation One required anatomical-volume value represents the single midline sacrum while preserving target or segmentation provenance.
 * @evidence contracts/common.md#clear-and-simple-design Sacral ownership stays separate from paired coxal records and shares the existing volume schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A sacral volume supplies neither posterior attachment landmarks nor a reconstructed bone surface.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies the shared bone, gluteal-origin relationship and missing surface/attachment information.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Sacrum measurement typing performs no segmentation, surface reconstruction or attachment localization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The midline volume declaration coordinates no repeated sacral generation requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Sacral metadata owns no segmented voxels, bone mesh or acquired scanner resource.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySacrumMeasurements {
  /** One midline sacral bone; its volume is separate from both coxal bones. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
