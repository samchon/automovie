/**
 * An ancestral shading field built from reference parent areas: the dense
 * per-vertex unit normals of both halves (face, then body; zero for unused
 * vertices), and a lookup of one canonical sample's unit normal under a parent.
 * Normals are dimensionless in the shared Y-up, +Z-forward frame.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonReferenceNormalField {
  /** Dense unit normals, face then body, flat triples; zero for unused vertices. */
  normals: number[];

  /**
   * Unit normal of one canonical sample under one parent.
   */
  at: (sample: number, parent: number) => readonly number[];
}
