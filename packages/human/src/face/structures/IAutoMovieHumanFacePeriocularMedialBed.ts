import type { IAutoMovieHumanFaceMaterialPatch } from "./IAutoMovieHumanFaceMaterialPatch";

/**
 * Registered medial canthal bed of one eye.
 *
 * Over most of its length the posterior lid margin lies on the globe. Near
 * the medial canthus it leaves the globe: the commissure sits nasal to it and
 * the caruncle and plica semilunaris fill the space between. This record
 * registers where that happens on the source skin, so the lid frame owner
 * seats the margin on the globe outside the bed and lets it rise to the
 * commissure inside it, and so the caruncle and plica are laid on registered
 * skin instead of a ruled sheet between the lid margins.
 *
 * Column counts are cage columns counted from the medial join along each lid,
 * the join included. Vertex lists index the cage's host skin surface.
 *
 * @evidence contracts/common.md#principled-implementation Cage-column counts determine the current medial seating transition; actual native pocket/plica edges or a qualified material patch supply source-normal visible relief instead of the legacy ruled sheet.
 * @evidence contracts/common.md#clear-and-simple-design Upper/lower bed extents, pocket/path populations and optional material cuts have separate domains under the containing skin cage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Medial relief requires resident pocket triangles, a supported extent and a plica path following their actual edges; those checks do not establish whole-pocket topology, and authoredConvention/sourceObserved labels certify neither histology nor individual caruncle anatomy or emitted-face clearance.
 * @evidence contracts/common.md#meaningful-documentation Join-inclusive column counts and resident versus material support identify each source address and the publisher qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bed record performs no arc reading, native clipping or relief construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registered support is source data, not current-pocket caching implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher index/patch arrays acquire no generated sheet or skin host.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularMedialBed {
  /** Upper-lid cage columns, counted from the medial join, whose margin is off the globe. */
  upperColumns: number;

  /** Lower-lid cage columns, counted from the medial join, whose margin is off the globe. */
  lowerColumns: number;

  /** Host skin vertices of the pocket the caruncle seats in. */
  pocketVertices: number[];

  /** Host skin vertices along the plica semilunaris, ordered inferior to superior. */
  plicaVertices: number[];

  /** Exact clipped material support when native vertex-only incidence is insufficient. */
  materialPatch?: IAutoMovieHumanFaceMaterialPatch;

  /** Whether the bed is an authored convention or was observed on the source. */
  qualification: "authoredConvention" | "sourceObserved";
}
