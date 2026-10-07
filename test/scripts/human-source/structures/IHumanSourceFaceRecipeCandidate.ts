/** One original sampled state projected through the immutable face cut.
 * @author Samchon
 */
export interface IHumanSourceFaceRecipeCandidate {
  /** Original sampled state identity. */
  name: string;

  /** Dense XYZ delta on the original published head cut, metres. */
  field: Float64Array;

  /** Per-axis field sum used to recover its common extraction shift. */
  sum: number[];
}
