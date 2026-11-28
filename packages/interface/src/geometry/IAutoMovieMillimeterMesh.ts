/**
 * Packed triangle positions and index triples borrowed by the mesh section
 * readers. Use one millimetre coordinate frame. Supply finite coordinates and
 * in-range whole vertex ordinals; the section reader assumes the buffer
 * layout.
 */
export interface IAutoMovieMillimeterMesh {
  /**
   * Borrowed packed XYZ in the input frame, three finite millimetre values per
   * vertex. Reading a section leaves this buffer intact.
   */
  positions: ArrayLike<number>;

  /**
   * Borrowed zero-based vertex ordinals, three in triangle winding order per
   * face. The section reader computes the number of complete triples from this
   * length.
   */
  indices: ArrayLike<number>;
}
