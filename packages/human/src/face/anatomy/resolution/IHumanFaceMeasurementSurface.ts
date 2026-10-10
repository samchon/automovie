/**
 * One whole final posed basis surface as a face measurement reads it.
 *
 * `positions` are flat XYZ metres in the basis head frame, each rounded to
 * Float32, in the surface's resident vertex order; `indices` are its oriented
 * triangles over those vertices, before material or UV seam splitting.
 * Both arrays are read only.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementSurface {
  /** Final posed XYZ metres, Float32-rounded, resident vertex order. */
  positions: readonly number[];

  /** Oriented triangles over the resident vertices. */
  indices: readonly number[];
}
