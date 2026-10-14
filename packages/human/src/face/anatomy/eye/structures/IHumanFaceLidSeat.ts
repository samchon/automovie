/**
 * Seating dimensions of the lid margin on the ocular exterior, in metres.
 * `HUMAN_FACE_LID_SEAT` holds the authored values and their grounds.
 *
 *
 * @evidence contracts/common.md#principled-implementation Separate authored posterior clearance, tear-film floor and medial bed extent retain metre meanings.
 * @evidence contracts/common.md#clear-and-simple-design HUMAN_FACE_LID_SEAT owns value provenance and seating/tissue builders consume their distinct roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These dimensions do not include facet-deviation allowances or clinical acquisition claims.
 * @evidence contracts/common.md#meaningful-documentation Fields identify posterior margin height, innermost tissue floor and medial commissure extent.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceLidSeat is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceLidSeat declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceLidSeat itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceLidSeat {
  /** Height of the seated posterior lid margin above the ocular exterior. */
  posteriorClearanceMetres: number;

  /** Authored ocular floor used for requested inner-face room and analytic relief targets; it does not guarantee every generated face's clearance. */
  tearFilmMetres: number;

  /** Arc length from the medial commissure over which the margin leaves the globe. */
  medialBedMetres: number;
}
