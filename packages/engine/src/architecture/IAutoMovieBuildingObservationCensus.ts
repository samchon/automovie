import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";

/**
 * The complete observation topology of one building unit.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Aggregates one building unit's exposed faces, corners, entrances, spaces, and routes as one denominator.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Types the building aggregate the compiled subject hierarchy and the review population share.
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
  /** Meetings of two exposed facades. */
  corners: IAutoMovieBuiltEnvelopeCorner[];
  /** Openings cut through an exposed separation, in code-unit order. */
  entrances: string[];
  /** Descendant spaces stating a volume, in code-unit order. */
  spaces: string[];
  /** Connectors landing in one of those spaces, in code-unit order. */
  connectors: string[];
}
