import {
  type Document,
  type Node,
  type YAMLError,
  type YAMLMap,
  isAlias,
  isMap,
  isScalar,
  parseDocument,
} from "yaml";

/**
 * Parse a pnpm workspace manifest once and return a lookup of its catalog entries.
 *
 * The lookup returns the string at `catalogs.<catalog>.<dependency>`, reading only direct children of each mapping: the same key at the top level, in a sibling catalog, or deeper inside the requested catalog never answers. An alias resolves to its anchored node. Parsing is strict and refuses duplicate keys, and a YAML error or warning, a missing key, an owner that is not a mapping, or a value that is not a non-blank string throws from the lookup with a message naming the requested catalog and dependency. A parse error is therefore raised by every lookup, not by this call.
 *
 * @param workspace Complete `pnpm-workspace.yaml` text.
 * @returns Lookup from catalog and dependency name to the specifier as written.
 *
 * @evidence contracts/common.md#principled-implementation The `yaml` package's document model gives each key its owning mapping, so ownership is decided structurally instead of by matching lines; strict parsing with `uniqueKeys` makes a duplicated key an error rather than a silent last-wins, and alias resolution follows the YAML anchor rules, refusing a forward or missing anchor.
 * @evidence contracts/common.md#clear-and-simple-design The function separates the once-per-manifest parse from the per-entry lookup, which is the split `resolveAutoMovieTemplateDependencyVersions` needs for its many lookups and `resolveAutoMovieCatalogVersion` reuses for one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A parse diagnostic is held and rethrown by each lookup with that lookup's context, never ignored, and no catalog or dependency name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states the lookup path, the direct-ownership rule, alias handling, every refusal, and that a parse error surfaces at lookup time.
 * @evidence contracts/performance.md#efficient-algorithms The manifest is parsed once, linear in its size; each lookup scans the direct keys of the root, `catalogs`, and one catalog, linear in those mappings' sizes, which are tens of keys.
 * @evidence contracts/performance.md#reuse-equivalent-work Every lookup made through one returned function shares the single parsed document, which is equivalent because the manifest text is immutable and the document is never modified; a different manifest needs a new call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned function retains the parsed document and its first diagnostic for as long as the caller holds the function, one document per call, and owns no handle.
 */
export const createAutoMovieCatalogVersionResolver: (
  workspace: string,
) => (catalog: string, dependency: string) => string = (
  workspace: string,
): ((catalog: string, dependency: string) => string) => {
  const document: Document = parseDocument(workspace, {
    prettyErrors: false,
    strict: true,
    uniqueKeys: true,
  });
  const diagnostic: YAMLError | undefined =
    document.errors[0] ?? document.warnings[0];
  return (catalog: string, dependency: string): string => {
    const context: string = `catalog "${catalog}" dependency "${dependency}"`;
    if (diagnostic !== undefined)
      throw new Error(`${context} has invalid YAML: ${diagnostic.message}`);
    const root: YAMLMap = requireMapping(
      document.contents,
      context,
      "document",
    );
    const catalogs: YAMLMap = requireMapping(
      requireDirect(root, "catalogs", context, "top-level mapping"),
      context,
      "catalogs",
    );
    const owner: YAMLMap = requireMapping(
      requireDirect(catalogs, catalog, context, "catalogs"),
      context,
      `catalog "${catalog}"`,
    );
    const resolved: Node | null = resolveNode(
      requireDirect(owner, dependency, context, `catalog "${catalog}"`),
      document,
      context,
    );
    if (isScalar(resolved) === false || typeof resolved.value !== "string")
      throw new Error(`${context} must be a string scalar`);
    if (resolved.value.trim().length === 0)
      throw new Error(`${context} must be a non-empty string scalar`);
    return resolved.value;
  };
};

const requireMapping: (
  node: Node | null,
  context: string,
  owner: string,
) => YAMLMap = (node: Node | null, context: string, owner: string): YAMLMap => {
  if (isMap(node) === false)
    throw new Error(`${context} requires ${owner} to be a mapping`);
  return node;
};

/** The value under `key` among the direct scalar keys of `mapping`. */
const requireDirect: (
  mapping: YAMLMap,
  key: string,
  context: string,
  owner: string,
) => Node | null = (
  mapping: YAMLMap,
  key: string,
  context: string,
  owner: string,
): Node | null => {
  const pair: YAMLMap["items"][number] | undefined = mapping.items.find(
    (item: YAMLMap["items"][number]): boolean =>
      isScalar(item.key) && item.key.value === key,
  );
  if (pair === undefined)
    throw new Error(`${context} is missing "${key}" under ${owner}`);
  return (pair.value as Node | null) ?? null;
};

const resolveNode: (
  node: Node | null,
  document: Document,
  context: string,
) => Node | null = (
  node: Node | null,
  document: Document,
  context: string,
): Node | null => {
  if (isAlias(node) === false) return node;
  const resolved: Node | undefined = node.resolve(document);
  if (resolved === undefined)
    throw new Error(`${context} contains an unresolved YAML alias`);
  return resolved;
};
