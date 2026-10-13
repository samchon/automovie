/**
 * One actual indexed material edge and its original positive metre length.
 *
 * @evidence contracts/common.md#principled-implementation Ordered original vertex ordinals and positive rest length preserve a unique indexed material edge for relative-distortion objectives.
 * @evidence contracts/common.md#clear-and-simple-design One edge carrier keeps topological identity separate from changing candidate positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Point proximity cannot manufacture adjacency and degenerate original length cannot become a distortion denominator.
 * @evidence contracts/common.md#meaningful-documentation Members give lower/higher vertex ordering and original meter distance meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Edge typing computes no adjacency extraction or objective assembly.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Original edge metadata describes a fixed material dependency without caching fitted distortion.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three scalar edge fields own no adjacency graph or native quadratic-program state.
 * @author Samchon
 */
export interface IHumanBodyUnderwearMaterialEdge {
  /** Lower original material vertex ordinal. */
  a: number;

  /** Higher original material vertex ordinal. */
  b: number;

  /** Original distance between these two material samples, metres. */
  length: number;
}
