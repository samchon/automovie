/**
 * Section origin and in-plane u and v axes in world coordinates. Supply unit
 * orthogonal axes for a geometric rotation frame. The same layout can carry
 * component derivatives of origin and the two axes; their units follow the
 * containing station jet.
 */
export interface IAutoMovieLoftSectionFrame {
  /**
   * Section origin [x, y, z] in world millimetres for a frame value. In a
   * derivative row it holds the origin's derivative in the containing
   * coordinate.
   */
  origin: [number, number, number];

  /**
   * World vector of the local u direction. Use a unit axis for a rotation
   * frame. A derivative row carries its component derivative.
   */
  u: [number, number, number];

  /**
   * World vector of the local v direction. Use a unit axis perpendicular to u
   * for a rotation frame. A derivative row carries its component derivative.
   */
  v: [number, number, number];
}
