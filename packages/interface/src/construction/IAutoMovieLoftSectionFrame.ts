/**
 * Section origin and two axes; geometric rotation frames require an orthonormal
 * pair. The same shape also stores component derivatives in layer jet fields.
 */
export interface IAutoMovieLoftSectionFrame {
  /**
   * World origin in mm for a frame value; its component derivatives use the
   * containing jet's coordinate units.
   */
  origin: [number, number, number];

  /**
   * In-plane x axis, unit for a geometric frame; a derivative record carries
   * its unnormalized component derivative.
   */
  u: [number, number, number];

  /**
   * In-plane z axis, orthogonal to u for a geometric frame; a derivative record
   * carries its unnormalized component derivative.
   */
  v: [number, number, number];
}
