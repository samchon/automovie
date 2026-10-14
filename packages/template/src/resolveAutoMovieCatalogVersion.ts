import { type IAutoMovieCatalogVersionProps } from "./IAutoMovieCatalogVersionProps";
import { createAutoMovieCatalogVersionResolver } from "./createAutoMovieCatalogVersionResolver";

/**
 * Read one dependency specifier from a pnpm workspace catalog.
 *
 * This is a single lookup through {@link createAutoMovieCatalogVersionResolver}, with the same direct-ownership rule and refusals; a caller with several lookups over one manifest should create the resolver once instead.
 *
 * @param props The manifest and the entry to read.
 * @returns The specifier exactly as written, such as `^1.2.3`.
 * @throws With a message naming the catalog and dependency when the manifest is invalid YAML or the entry is missing, misplaced, or not a non-blank string.
 *
 * @evidence contracts/common.md#principled-implementation The lookup inherits the structural YAML reading of the resolver, so a commented, quoted, anchored, or CRLF entry resolves to its interpreted value.
 * @evidence contracts/common.md#clear-and-simple-design The function is a one-line adapter from a props record to the resolver, so single and repeated lookups share one implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every refusal of the resolver propagates unchanged, with nothing caught or defaulted here.
 * @evidence contracts/common.md#meaningful-documentation The comment states the relation to the resolver, when to use the resolver instead, the return form, and every failure.
 * @evidence contracts/performance.md#efficient-algorithms One manifest parse is followed by scans of the direct root, catalogs and selected-catalog keys, plus alias resolution when used. Total work depends on manifest size, and repeated lookups should share the resolver rather than repeat this parse.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single lookup has nothing to share; repeated lookups belong on one resolver.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parsed document becomes unreachable when the call returns, and no handle is opened.
 */
export const resolveAutoMovieCatalogVersion: (
  props: IAutoMovieCatalogVersionProps,
) => string = (props: IAutoMovieCatalogVersionProps): string =>
  createAutoMovieCatalogVersionResolver(props.workspace)(
    props.catalog,
    props.dependency,
  );
