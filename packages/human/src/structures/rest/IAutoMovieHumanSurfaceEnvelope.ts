/**
 * Independent dimensions in one declared rest section plane. A supplied
 * breadth/depth/girth triple is retained together; no other measured dimension
 * is changed to make the selected section family fit.
 */
export interface IAutoMovieHumanSurfaceEnvelope {
  /** Full relaxed skin-envelope breadth along the chart's breadth axis, mm. */
  breadthMm: number;

  /** Full anterior/posterior extent along the chart's anterior axis, mm. */
  depthMm: number;

  /** Convex-tape perimeter of this enclosing section, mm. */
  perimeterMm: number;
}
