/**
 * One triangle of an eye's textured globe: its three neutral corner positions
 * and the matching three corner texture coordinates.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisGlobeTriangle {
  /** Three neutral corner positions, metres. */
  positions: [number, number, number][];

  /** Three corner texture coordinates, in the same order. */
  uvs: [number, number][];
}
