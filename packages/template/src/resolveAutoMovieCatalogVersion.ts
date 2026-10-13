import { createAutoMovieCatalogVersionResolver } from "./createAutoMovieCatalogVersionResolver";

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
 * @author Samchon
 */
export interface IAutoMovieCatalogVersionProps {
  /** Catalog name, a direct child of the top-level `catalogs` mapping. */
  catalog: string;

  /** Dependency name, a direct child of the requested catalog. */
  dependency: string;

  /** Complete `pnpm-workspace.yaml` text. */
  workspace: string;
}

/**
 * Read one dependency specifier from a pnpm workspace catalog.
 *
 * This is a single lookup through {@link createAutoMovieCatalogVersionResolver},
 * with the same direct-ownership rule and refusals; a caller with several
 * lookups over one manifest should create the resolver once instead.
 *
 * @param props The manifest and the entry to read.
 * @returns The specifier exactly as written, such as `^1.2.3`.
 * @throws With a message naming the catalog and dependency when the manifest
 *   is invalid YAML or the entry is missing, misplaced, or not a non-blank
 *   string.
 *
 * @evidence contracts/common.md#principled-implementation The lookup inherits the structural YAML reading of the resolver, so a commented, quoted, anchored, or CRLF entry resolves to its interpreted value.
 * @evidence contracts/common.md#clear-and-simple-design The function is a one-line adapter from a props record to the resolver, so single and repeated lookups share one implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every refusal of the resolver propagates unchanged, with nothing caught or defaulted here.
 * @evidence contracts/common.md#meaningful-documentation The comment states the relation to the resolver, when to use the resolver instead, the return form, and every failure.
 * @evidence contracts/performance.md#efficient-algorithms One parse linear in the manifest and one direct-key lookup; it is the right cost for a single lookup only, which the comment states.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single lookup has nothing to share; repeated lookups belong on one resolver.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parsed document becomes unreachable when the call returns, and no handle is opened.
 */
export const resolveAutoMovieCatalogVersion = (
  props: IAutoMovieCatalogVersionProps,
): string =>
  createAutoMovieCatalogVersionResolver(props.workspace)(
    props.catalog,
    props.dependency,
  );
