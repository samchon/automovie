import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";

/**
 * The complete observation topology of one building unit.
 *
 * Produced by `builtEnvironmentBuildingCensus`, one per building sorted by
 * building id. The three face lists partition this building's envelope faces
 * by aspect, in boundary-id order. `spaces` lists only descendant spaces that
 * state a volume, while `connectors` reads every descendant space, including
 * the building's root and spaces with no volume.
 *
 * @evidence contracts/common.md#principled-implementation Every population is derived from the record: envelope faces by single-space separation, aspect by outward normal, corners by facade proximity, spaces by descendant containment plus a stated volume, connectors by exact stop membership.
 * @evidence contracts/common.md#clear-and-simple-design One record per building so a review counts each population against one owner; the facade, roof and underside lists are partitions of one envelope list rather than three derivations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No building, boundary label or connector kind is special-cased; `spaces` and `connectors` deliberately read different space populations, and the documentation states that difference instead of implying one.
 * @evidence contracts/common.md#meaningful-documentation States the producer and ordering of every list, which spaces each list reads, and that entrances include openings through roofs and undersides.
 * @evidenceExclude contracts/performance.md#cost-and-resources Holds nothing beyond its lists, but its producer costs O(buildings × (faces + corners + openings + spaces)) plus a full connector scan per descendant space, and derives the envelope faces twice, once directly and again inside `builtEnvironmentEnvelopeCorners`, so every face is placed and containment-probed twice per census.
 * @author Samchon
 */
export interface IAutoMovieBuildingObservationCensus {
  /** Building unit identity within its environment. */
  building: string;

  /** Exposed separations read in elevation. */
  facades: IAutoMovieBuiltEnvelopeFace[];

  /** Exposed separations read from above. */
  roofs: IAutoMovieBuiltEnvelopeFace[];

  /** Exposed separations read from below. */
  undersides: IAutoMovieBuiltEnvelopeFace[];

  /** Meetings of two exposed facades of this building. */
  corners: IAutoMovieBuiltEnvelopeCorner[];

  /**
   * Openings cut through any of this building's exposed separations, roofs and
   * undersides included, in code-unit order.
   */
  entrances: string[];

  /** Descendant spaces stating a volume, in code-unit order. */
  spaces: string[];

  /**
   * Connectors with an end or landing in any descendant space of the building,
   * whether or not that space states a volume, deduplicated and in code-unit
   * order.
   */
  connectors: string[];
}
