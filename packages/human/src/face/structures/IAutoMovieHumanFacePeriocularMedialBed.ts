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
 * @evidence contracts/common.md#principled-implementation The bed is stated on the source topology that carries it, so every shape state transports it with the skin.
 * @evidence contracts/common.md#clear-and-simple-design Two counts, two vertex lists and one qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default bed exists; an absent registration leaves the frame owner's authored span in force.
 * @evidence contracts/common.md#meaningful-documentation States the anatomy the record stands for, how columns are counted and what the vertex lists index.
 * @evidence contracts/modeling.md#shared-boundaries The bed is the boundary shared by both lid margins, the caruncle and the plica; one registration serves all four.
 * @evidence contracts/modeling.md#spatial-conventions Integer cage columns and host-surface vertex indices; no coordinates.
 * @evidence contracts/anatomy.md#anatomical-source No read primary source gives caruncle or plica dimensions or the length over which the margin leaves the globe; the publisher records the kind of its registration in `qualification`.
 * @evidence contracts/anatomy.md#parametric-authority Offline shared source registration; it is not a personal authoring input.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Locates existing parts and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builders that consume it own the displayed result.
 * @evidenceExclude contracts/anatomy.md#permitted-range The lid frame owner admits the registration against the cage it belongs to.
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
