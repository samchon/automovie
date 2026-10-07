/** One source-authored oriented polygon with its own shared corner chart. */
export interface IHumanSourceAuthoredCell {
  /** Stable authoring cell identity, independent of execution paths. */
  id: string;
  /** Native authoring vertex ordinals in oriented cyclic order. */
  vertices: number[];
  /** Native UV pairs in precisely the same corner order. */
  cornerUV: number[][];
  /** Appearance/source part ownership remains separate from index lineage. */
  materialRole: string;
  partId: string;
  /** Original sampled polygon lineage, absent for newly authored cells. */
  originalNativePolygon?: number;
}
