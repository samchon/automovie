/**
 * Raw normal binding of one used surface vertex to its source parent.
 * The vertex reads the parent's existing canonical ordered chart, so no cell
 * or coordinates are stored. A supplied normalParents entry keeps its raw
 * selector meaning and must agree with this parent.
 *
 * @evidence contracts/common.md#principled-implementation A parent ordinal selects the source triangle's canonical ordered normal chart without additional coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The raw binding omits feature-cell fields that do not apply.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An accompanying normal-parent selector must agree rather than silently replacing the raw parent.
 * @evidence contracts/common.md#meaningful-documentation The prose explains canonical-chart reuse and selector agreement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The raw normal parent binding has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The raw normal parent binding schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The raw normal parent binding declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisNormalParentBinding {
  /** Raw parent ordinal in the enclosing partition's original triangle tree. */
  readonly parent: number;
}
