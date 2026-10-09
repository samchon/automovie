/** Admitted native sparse state in Blender XYZ metres, with no frame conversion.
 * Arrays are owned; original sample addresses and joint order remain unchanged.
 * @author Samchon
 */
export interface IHumanHeadSourceNativeState {
  /** Original native vertex identities, in the sample's recorded row order. */
  vertices: number[];

  /** Native XYZ displacement triples, one per retained sparse row. */
  deltas: Float64Array;

  /** Dense native XYZ joint-witness displacement triples. */
  landmarks: Float64Array;
}
