/**
 * Inputs for one pnpm workspace catalog lookup.
 *
 * @evidence contracts/development/design.md#principled-representation The lookup is addressed by catalog and dependency name because pnpm names catalog entries that way in `catalogs.<catalog>.<dependency>`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three strings are the whole question, and parsing stays with `createAutoMovieCatalogVersionResolver`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no default catalog or fallback value, so a lookup either names a real entry or throws.
 * @evidence contracts/development/common.md#meaningful-documentation Each member states which level of the manifest it selects and that only direct children count.
 */
export interface IAutoMovieCatalogVersionProps {
  /** Catalog name, a direct child of the top-level `catalogs` mapping. */
  catalog: string;

  /** Dependency name, a direct child of the requested catalog. */
  dependency: string;

  /** Complete `pnpm-workspace.yaml` text. */
  workspace: string;
}
