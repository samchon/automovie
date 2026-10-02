/** Clause-derived metre-axis samples and separately stated summary intervals.
 * The parser owns these arrays; relation queries consume them without mutation. */
export interface ITemplePartBound {
  X: number[]; Y: number[]; Z: number[];
  summary: Record<"X" | "Y" | "Z", number[][]>;
}
