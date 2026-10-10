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
