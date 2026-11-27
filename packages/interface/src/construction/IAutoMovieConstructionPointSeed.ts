import type { IAutoMovieConstructionChartPoint } from "./IAutoMovieConstructionChartPoint";

/**
 * A join's seed given as a chart point near the curve on the part's face and on
 * the host's face, from the landmarks that locate the contact.
 *
 * A face is named by the view part or the join that made it: a view part's name
 * for its lofted surface, a join's name for its blend. Newton's method refines
 * the seed onto the curve; a seed with no meeting near it is one diagnostic and
 * the join is left out.
 */
export interface IAutoMovieConstructionPointSeed {
  /** Discriminator. */
  type: "point";

  /**
   * The face of the part that meets the host: a view part's name in the part's
   * subtree.
   */
  partFace: string;

  /**
   * The host face the seed lies on: a view part's or a join's name in the
   * host's subtree.
   */
  hostFace: string;

  /**
   * The part face's chart point near the curve, station in metres and phase in
   * radians.
   */
  part: IAutoMovieConstructionChartPoint;

  /**
   * The host face's chart point, station in metres and phase in radians; a
   * blend face's station runs from its host rail (0) to its part rail.
   */
  host: IAutoMovieConstructionChartPoint;
}
