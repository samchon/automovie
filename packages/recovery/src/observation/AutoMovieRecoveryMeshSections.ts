import type { IAutoMovieRecoveryInput } from "@automovie/interface";

import { extractRecoveryMeshSections } from "../internal/extractRecoveryMeshSections";
import type { IAutoMovieRecoveryMeshSections } from "../structures/mesh/IAutoMovieRecoveryMeshSections";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";

/**
 * Automatic section extraction and source-independent cubic publication.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inputs and results distinguish physical registration, exact coordinate aliases, open gaps and unsupported events.
 * @evidence contracts/development/design.md#principled-representation Represents Automatic section extraction and source-independent cubic publication: companion namespace of 1 member (`extract`); units and frames named in its text: local, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieRecoveryMeshSections` in packages/recovery/src/observation/AutoMovieRecoveryMeshSections.ts; its surface is the 1 member listed and the text shows 3 other files naming it, mostly packages/recovery (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieRecoveryMeshSections {
  /**
   * Extract every section component with automatic stations, feature corners and PL critical brackets.
   * Physical ties remain explicit; cutting and PL topology share one immutable scalar chart.
   * The optional progress observer reports completed plane and slab populations without changing geometry.
   * An explicit sectionLimit publishes an incomplete sorted-station prefix; coverage records the full omission.
   * The optional lineage observer receives copied incident face IDs per contour, including local failures and degenerate contacts; callback exceptions escape the local fitting catch and fail extraction.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Regular stations derive from projected bounds; lower/upper PL links add physical critical brackets and exact incident edge support. Source-face witnesses preserve cavity winding; optional lineage reports their original input ordinals without inferring semantic regions or exact cut patches.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses the existing cut, critical, orientation and plane operators instead of adding a second mesh engine. A per-level observation cache supplies both event incidence and fitting.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every component at each retained station survives. An explicit computational prefix reports all omitted stations and source range; it never changes the station/fit policy or closes its terminal cut. No largest-loop selection, invented closure, source control table or source normal field enters reconstruction.
   * @evidence contracts/development/common.md#meaningful-documentation States automatic physical levels, source orientation witnesses, exact positional alias limitations, finite-polyline scope and incomplete prefix coverage.
   * @evidence contracts/development/implementation.md#efficient-algorithms For V vertices, T triangles, K cuts and P observations, preparation costs O(V+T log T), PL links cost O(T) plus local traversals, interval queries prune disjoint face bounds and sort matching face IDs, and cutting/slab graphs traverse only their candidates; fitting owns its adaptive cost. Worst-case all faces remain candidates; memory is O(V+T+P).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Immutable source admission, signed scalar samples and triangle height bounds are prepared once. Each exact plane is cut once; its source supports supply event incidence and optional lineage without recutting. Enabled lineage copies each contour's incident face IDs once; omitted lineage allocates no record or copy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources maxSections and maxSpans bound generated populations; transient adjacency, raw cut points and source supports expire on return or failure. The observer owns any retained copied IDs and its unbounded callback work; no geometry arrays transfer.
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
