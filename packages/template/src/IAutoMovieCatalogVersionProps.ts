/**
 * Inputs for one pnpm workspace catalog lookup.
 *
 * @evidence contracts/common.md#principled-implementation The lookup is addressed by catalog and dependency name because pnpm names catalog entries that way in `catalogs.<catalog>.<dependency>`.
 * @evidence contracts/common.md#clear-and-simple-design Three strings are the whole question, and parsing stays with `createAutoMovieCatalogVersionResolver`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no default catalog or fallback value, so a lookup either names a real entry or throws.
 * @evidence contracts/common.md#meaningful-documentation Each member states which level of the manifest it selects and that only direct children count.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An input record of three strings chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record describes one lookup; repeated lookups over one manifest reuse its parse through `createAutoMovieCatalogVersionResolver`.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record holds the manifest text and two names for one call and no handle.
 */
export interface IAutoMovieCatalogVersionProps {
  /** Catalog name, a direct child of the top-level `catalogs` mapping. */
  catalog: string;

  /** Dependency name, a direct child of the requested catalog. */
  dependency: string;

  /** Complete `pnpm-workspace.yaml` text. */
  workspace: string;
}
