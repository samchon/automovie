/**
 * Upper and lower midline vertices on one face basis surface.
 *
 * The contact owner reads the pair's posed separation along the basis frame's
 * vertical, made perpendicular to the mandibular axis, as an aperture: the
 * vermilion seam pair gives the interlabial and the incisal edge pair the
 * interincisal aperture. Both vertices are found once on the shared topology.
 *
 * @evidence contracts/common.md#principled-implementation A resident surface and upper/lower source indices identify the seam or incisal witnesses; measureHumanFaceAperture poses those points and projects their separation in the canonical jaw-axis frame.
 * @evidence contracts/common.md#clear-and-simple-design One pair reuses shared source topology without private world points or separate lip/incisor measurement schemas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The canonical direction owner refuses an exactly vertical jaw axis rather than selecting a threshold frame; registered indices do not by themselves prove clinical vertical or closure admission.
 * @evidence contracts/common.md#meaningful-documentation Upper/lower order and the nearest-basis-Y perpendicular convention distinguish model aperture from arbitrary Euclidean distance or clinical acquisition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pair performs no vertex posing or signed projection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stable source witnesses are data; pose/frame reuse is consumer-owned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record acquires no posed surface or contact query.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMidlinePair {
  /** ID of the basis surface both vertices belong to. */
  surface: string;

  /** Upper midline vertex index on that surface. */
  upper: number;

  /** Lower midline vertex index on that surface. */
  lower: number;
}
