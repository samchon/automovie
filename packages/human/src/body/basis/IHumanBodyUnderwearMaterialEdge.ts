/** One actual indexed material edge and its original positive metre length. */
export interface IHumanBodyUnderwearMaterialEdge {
  /** Lower original material vertex ordinal. */
  a: number;

  /** Higher original material vertex ordinal. */
  b: number;

  /** Original distance between these two material samples, metres. */
  length: number;
}
