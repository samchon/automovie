import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";

/**
 * A named cartilage tissue volume distinct from bone and fibrous ligament.
 *
 * Whole-volume imaging cannot determine an individual joint's thickness,
 * curvature or contact pressure; these require separate generated surfaces.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCartilageMeasurements {
  /** Segmented or target cartilage volume in millilitres. */
  readonly cartilageVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
