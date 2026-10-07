/** Raw native sparse state and dense landmark span in Blender metres.
 * Offsets/counts are element ordinals, not byte positions. Empty spans are legal.
 * @author Samchon
 */
export interface IHumanSourceSparseStateInput {
  name: string;
  vertices: number;
  rowsVertex: ArrayLike<number>;
  rowsDelta: ArrayLike<number>;
  rowOffset: number;
  rowCount: number;
  landmarkDelta: ArrayLike<number>;
  landmarkOffset: number;
  landmarkCount: number;
}
