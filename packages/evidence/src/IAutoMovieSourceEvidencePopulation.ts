import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";

/**
 * Source globs, owner kinds, selected native symbols, obligation route and optional design branch define one current source family.
 *
 * @evidence contracts/common.md#principled-implementation Source globs, owner kinds, selected native symbols, obligation route and optional design branch define one current source family.
 * @evidence contracts/common.md#clear-and-simple-design SOURCES supplies one metadata record reused by physical owner admission and claim assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null design is intentional for delivery or serialization families, not a missing owner repaired by a fallback.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish required primary owners from all selected source units and project-relative file selectors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; SOURCES retains the fixed metadata inventory consumed by sourceClaims and validateHosts, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; SOURCES retains the fixed metadata inventory consumed by sourceClaims and validateHosts, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; SOURCES retains the fixed metadata inventory consumed by sourceClaims and validateHosts, while the caller or module owns the lifetime of its values.
 */
export interface IAutoMovieSourceEvidencePopulation {
  /** Corresponding authored design branch, or null for delivery or serialization owners. */
  design: Exclude<
    AutoMovieAuthoredDocumentLayer,
    | "briefs"
    | "research"
    | "screenplays"
    | "scripts"
    | "settings"
    | "treatments"
  > | null;

  /** Project-relative TypeScript selector population for this family. */
  files: readonly string[];

  /** Required primary runtime declaration kinds admitted in each selected file. */
  ownerKinds: readonly ("class" | "function" | "property")[];

  /** Native selectors that connect one primary source owner to its authored file. */
  ownerSymbols: readonly ("function" | "property" | "type")[];

  /** Bundled obligation basename resolved through the family inventory. */
  obligation: string;

  /** Native source-unit selectors that answer principles and realization duties. */
  symbols: readonly ("function" | "property" | "type")[];
}
