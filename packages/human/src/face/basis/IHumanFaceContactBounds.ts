/**
 * Compiled collider bounds in basis metres, used only for reach pruning.
 * They do not replace the original signed geometry query.
 *
 * @evidence contracts/common.md#principled-implementation resolveHumanFaceContact computes axis extrema from actual collider coordinates; expanded boxes reject points outside source-authored reach before native signed queries.
 * @evidence contracts/common.md#clear-and-simple-design A separate low/high record exposes broad-phase responsibility without replacing collider geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds prune reach only; actual signed queries and candidate verification still determine supported contact floors.
 * @evidence contracts/common.md#meaningful-documentation Prose states basis metres and pruning-only meaning; low/high cover three basis axes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record implements no extrema scan; collider compilation owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; contact reuses compiled boxes across soft vertices.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record acquires no handle; its two triples belong to the compiled collider.
 *
 * @author Samchon
 */
export interface IHumanFaceContactBounds {
  /** Minimum coordinate on each basis axis. */
  low: number[];

  /** Maximum coordinate on each basis axis. */
  high: number[];
}
