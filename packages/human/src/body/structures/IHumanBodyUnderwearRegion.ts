/**
 * The coverage of one actual source material region before performance.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearRegion {
  /** Native body surface supplying the region. */
  surface: number;

  /** Source ordinals in the original renderer-corner order. */
  sources: readonly number[];

  /** Rest coverage gathered through the same original corner table. */
  field: readonly number[];
}
