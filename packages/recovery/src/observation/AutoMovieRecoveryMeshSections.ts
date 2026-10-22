import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";

import { extractRecoveryMeshSections } from "../internal/extractRecoveryMeshSections";
import type { IAutoMovieRecoveryMeshSections } from "../structures/mesh/IAutoMovieRecoveryMeshSections";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";

/**
 * Automatic section extraction and source-independent cubic publication.
 *
 * @evidence contracts/common.md#principled-implementation Existing triangle-plane cuts and PL link classification derive stations and topology; adaptive fitting publishes only physical coefficients and named incidence.
 * @evidence contracts/common.md#clear-and-simple-design Source mesh addresses stay outside the coefficient result; an optional acquisition observer receives copied incident face IDs separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every component is retained, open arcs stay open and no person-specific plane or control table is accepted.
 * @evidence contracts/common.md#meaningful-documentation Inputs and results distinguish physical registration, exact coordinate aliases, open gaps and unsupported events.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace performs no extraction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No module cache exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No persistent resources exist.
 */
export namespace AutoMovieRecoveryMeshSections {
  /**
   * Extract every section component with automatic stations, feature corners and PL critical brackets.
   * Physical ties remain explicit; cutting and PL topology share one immutable scalar chart.
   * The optional progress observer reports completed plane and slab populations without changing geometry.
   * An explicit sectionLimit publishes an incomplete sorted-station prefix; coverage records the full omission.
   * The optional lineage observer receives copied incident face IDs per contour, including local failures and degenerate contacts; callback exceptions escape the local fitting catch and fail extraction.
   *
   * @evidence contracts/common.md#principled-implementation Regular stations derive from projected bounds; lower/upper PL links add physical critical brackets and exact incident edge support. Source-face witnesses preserve cavity winding; optional lineage reports their original input ordinals without inferring semantic regions or exact cut patches.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the existing cut, critical, orientation and plane operators instead of adding a second mesh engine. A per-level observation cache supplies both event incidence and fitting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every component at each retained station survives. An explicit computational prefix reports all omitted stations and source range; it never changes the station/fit policy or closes its terminal cut. No largest-loop selection, invented closure, source control table or source normal field enters reconstruction.
   * @evidence contracts/common.md#meaningful-documentation States automatic physical levels, source orientation witnesses, exact positional alias limitations, finite-polyline scope and incomplete prefix coverage.
   * @evidence contracts/performance.md#efficient-algorithms For V vertices, T triangles, K cuts and P observations, preparation costs O(V+T log T), PL links cost O(T) plus local traversals, interval queries prune disjoint face bounds and sort matching face IDs, and cutting/slab graphs traverse only their candidates; fitting owns its adaptive cost. Worst-case all faces remain candidates; memory is O(V+T+P).
   * @evidence contracts/performance.md#reuse-equivalent-work Immutable source admission, signed scalar samples and triangle height bounds are prepared once. Each exact plane is cut once; its source supports supply event incidence and optional lineage without recutting. Enabled lineage copies each contour's incident face IDs once; omitted lineage allocates no record or copy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources maxSections and maxSpans bound generated populations; transient adjacency, raw cut points and source supports expire on return or failure. The observer owns any retained copied IDs and its unbounded callback work; no geometry arrays transfer.
   */
  export function extract(
    input: IAutoMovieRecoveryInput,
    progress?: (phase: string, completed: number, total: number) => void,
    sectionLimit?: number,
    onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void,
  ): IAutoMovieRecoveryMeshSections {
    return extractRecoveryMeshSections(
      input,
      progress,
      sectionLimit,
      onSourceLineage,
    );
  }
}
