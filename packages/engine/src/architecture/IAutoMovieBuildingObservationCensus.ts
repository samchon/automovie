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
 * @evidence contracts/common.md#principled-implementation A per-building join of populations each derived from the record by its own function: envelope faces split by aspect, corners by building, openings on those faces, descendant spaces filtered by stated volume and connectors deduplicated through a set, each list in code-unit order so the result is deterministic.
 * @evidence contracts/common.md#clear-and-simple-design One record per building groups every population a building review counts, keeping faces and corners as resolved records rather than ids so a reviewer does not join them back to geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population is declared by the reviewer or filtered by an authored label; the asymmetry between `spaces`, which needs a stated volume, and `connectors`, which reads every descendant including the root, is the producer's rule and is documented.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its order, that the three face lists partition the building's envelope faces by aspect in boundary-id order, what each id list contains and its order, and which space population `spaces` and `connectors` each read.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the census cost, envelope derivation once per environment followed by per-building filters and descendant walks, is answered on `builtEnvironmentBuildingCensus`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The census derives faces once, passes those faces to `builtEnvelopeFaceCorners` and filters both lists per building; no census is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References the face and corner records built for this call plus fresh id arrays, all owned by the caller's census list and released with it.
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
