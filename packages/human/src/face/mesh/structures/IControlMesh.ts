/**
 * A triangle control cage with one material label per face.
 *
 * @author Samchon
 */
export interface IControlMesh {
  /** XYZ control vertices in the caller's coordinate unit, millimetres here. */
  positions: number[][];

  /** Oriented triangle triples referencing positions, with manifold adjacency. */
  indices: number[];

  /** One opaque material-region label per triangle, inherited by all children. */
  groups: number[];

  /** Optional reference XYZ carried by the same subdivision masks as positions. */
  reference?: number[][];

  /** Optional linear RGB on the final shared vertices, before contact welding. */
  colors?: number[][];
}
