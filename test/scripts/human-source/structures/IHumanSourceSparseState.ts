/** Owned admitted native rows and public-frame delta triples.
 * Native identities are retained separately from any active-root retirement.
 * @author Samchon
 */
export interface IHumanSourceSparseState {
  vertices: number[];
  deltas: number[];
  landmarks: Float64Array;
}
