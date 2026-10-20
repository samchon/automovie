/**
 * Saved cubic coefficient basis. The choice preserves the curve's phase chart.
 *
 * @evidence contracts/common.md#principled-implementation Both bases describe the same degree-three polynomial on each original interval.
 * @evidence contracts/common.md#clear-and-simple-design One closed choice serves observation, conversion and command publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The choice does not request fitting or degree reduction.
 * @evidence contracts/common.md#meaningful-documentation States that the phase chart remains authoritative.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased union performs no work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resources.
 */
export type AutoMovieRecoveryCurveFormat = "bezier" | "hermite";
