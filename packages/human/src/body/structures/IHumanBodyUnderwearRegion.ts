/**
 * The coverage of one actual source material region before performance.
 *
 * @evidence contracts/common.md#principled-implementation Native surface identity and original renderer-corner ordinals align a region's rest coverage with its performed vertices.
 * @evidence contracts/common.md#clear-and-simple-design A region record preserves one source correspondence beside its gathered field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage is gathered through original corner order rather than inferred from rendered positions.
 * @evidence contracts/common.md#meaningful-documentation Members explain native surface identity and matching source-field order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The garment region correspondence declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The garment region correspondence declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The garment region correspondence type has no runtime acquisition, retention or release operation.
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
