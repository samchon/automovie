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
