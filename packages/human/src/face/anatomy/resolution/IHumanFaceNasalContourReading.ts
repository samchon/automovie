/**
 * Source-projected ordered contour quantities, independent of clinical basal
 * aperture acquisition. The registered source normal owns the reading plane.
 *
 * @author Samchon
 */
export interface IHumanFaceNasalContourReading {
  /** Enclosed orthogonal projection area in square metres. */
  area: number;

  /** Longest projected chord in metres. */
  longAxis: number;

  /** Projected extent perpendicular to that longest chord, in metres. */
  shortAxis: number;
}
