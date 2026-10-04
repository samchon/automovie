/**
 * Two dense XYZ fields over the same published vertices and the published
 * neutral they are added to. All arrays have three values per vertex.
 */
export interface IHumanSourceErrorInput {
  published: Float64Array;
  candidate: Float64Array;
  neutral: ArrayLike<number>;
}
