import type * as THREE from "three";

/**
 * A viewer-owned field overlay bound to one analysis run.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Associates one Points object with its exact selected-sample count and normalization range; the count/range describe this overlay rather than claiming solver completeness or metric success independently of its admitted artifact.
 * @evidence contracts/common.md#clear-and-simple-design Exposes the scene attachment and small inspection/retirement surface; measurement stays in the analysis run and geometry/material creation stays in buildAnalysisOverlayObject.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no fabricated verdict or fixture marker; borrowed-material distinction is explicit and no renderer method is replaced.
 * @evidence contracts/common.md#meaningful-documentation Documents attachment, selected sample count, color normalization domain and geometry/default-material ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result shape selects no sample traversal or coloring algorithm; construction owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result shape coordinates no repeated construction or shared solver request.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface owns no physical retirement; the constructor and returned disposer determine actual geometry/default-material release.
 */
export interface IAutoMovieAnalysisOverlayObject {
  /** Add these points to the current scene. */
  object: THREE.Points;

  /**
   * Release the geometry, and the material when this object created it.
   *
   * @evidence contracts/common.md#principled-implementation Calls actual geometry disposal and conditionally disposes only the builder-created material; borrowed material is preserved, but throwing geometry disposal prevents the subsequent owned-material call.
   * @evidence contracts/common.md#clear-and-simple-design Keeps overlay retirement on its returned handle rather than requiring the scene host to infer material ownership from the Points object.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Material ownership follows whether the caller supplied it, not object names or disposal-event fixtures; no foreign disposal method is replaced.
   * @evidence contracts/common.md#meaningful-documentation States exact geometry/default-material scope; the builder's lifetime answer records that calls are not memoized or failure-independent.
   * @evidence contracts/performance.md#efficient-algorithms Calls at most two fixed-resource disposers; no scene or sample traversal is required.
   * @evidence contracts/performance.md#reuse-equivalent-work Performs actual retirement each invocation rather than caching success; repeated calls are not made equivalent by this contract.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the geometry and optionally default material release while preserving borrowed material; the returned handle still references its closed resources and samples until the caller releases the handle.
   */
  dispose: () => void;

  /**
   * Points drawn, one per spatial sample of the chosen metric.
   *
   * @evidence contracts/common.md#principled-implementation Reads the selected sample array length rather than counting rendered pixels or reporting all run samples.
   * @evidence contracts/common.md#clear-and-simple-design Exposes the construction count without requiring consumers to inspect buffer attribute layout.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns the actual selected collection length, with no precomputed fixture answer or substituted resource method.
   * @evidence contracts/common.md#meaningful-documentation States the metric-selected sample unit and its one-point correspondence.
   * @evidence contracts/performance.md#efficient-algorithms Reads one array length in constant time and allocates no result object.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the already selected collection instead of refiltering the run per inspection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its closure keeps the selected sample references with the overlay handle, bounded by the metric's sample count and released only when that handle becomes unreachable.
   */
  count: () => number;

  /**
   * The value range the colour ramp was normalized over.
   *
   * @evidence contracts/common.md#principled-implementation Returns the exact validated construction min/max, including a caller-pinned domain; it is not a fresh minimum/maximum of current GPU attributes.
   * @evidence contracts/common.md#clear-and-simple-design Exposes the scale beside the points so reports can interpret colors without reconstructing their domain.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports authored/resolved scale values without fixture bounds, approximate equality or a hidden rescan.
   * @evidence contracts/common.md#meaningful-documentation Identifies normalization-domain meaning rather than implying this pair is necessarily the sample extrema.
   * @evidence contracts/performance.md#efficient-algorithms Returns two captured scalars in a fresh constant-size record with no sample traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the domain computed once during construction; changing original run/domain objects cannot mutate these captured values.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only two scalar bounds through the handle and transfers each returned small record to the caller; acquires no renderer handle or task.
   */
  range: () => { min: number; max: number };
}
