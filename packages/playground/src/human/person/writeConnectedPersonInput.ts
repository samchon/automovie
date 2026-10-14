import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * Return an independent copy of a person document with one catalogue input written or removed; the caller's document is unchanged. Paths are literal segments supplied by the catalogue, and values retain their precision without range validation.
 *
 * Writing traverses only own ancestors and creates ordinary enumerable data properties, preserving supported literal source ids even when they name a prototype member. A supplied owner default is cloned only at its exact seedPath, preserving neighboring members of an omitted population. Removal prunes empty ancestors while retaining face/body roots and their required shape records. Completeness, supported keys and ranges remain the generation owner's admission decision.
 *
 * @evidence contracts/common.md#principled-implementation Cloning separates edits from the current draft; literal path traversal preserves authored identifiers, exact seed-prefix matching inserts owner defaults and empty-record pruning restores omission without deleting required document roots.
 * @evidence contracts/common.md#clear-and-simple-design One copied document and an ancestor chain serve both writing and removal; defaults are supplied by their owner rather than derived by this generic editor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Catalogue-owned paths are a caller premise, not a general untrusted-path sanitizer. The operation does not clamp values, fabricate anatomy or treat an edited document as accepted.
 * @evidence contracts/common.md#meaningful-documentation The comment explains independent copying, literal paths, exact default insertion, omission pruning and separate admission.
 * @evidence contracts/performance.md#efficient-algorithms The full document clone costs O(n) document data; ancestor traversal/storage is O(d), matching a seed prefix adds its segment checks and pruning enumerates the visited records' keys. Whole-document copying is required by this independent-copy editing contract.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every edit requires its own mutable document and optional seed copy; this function retains no cross-edit cache or prior clone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned document belongs to the editing transaction and the local ancestor chain ends with the call. No worker, timer or cross-call state is retained; published documents and history remain panel/editor-owned.
 *
 * @author Samchon
 */
export function writeConnectedPersonInput(
  document: IAutoMovieHumanPersonDocument,
  path: readonly string[],
  value: number | string | null | undefined,
  seed: object | null = null,
  seedPath: readonly string[] = path.slice(0, -1),
): IAutoMovieHumanPersonDocument {
  if (path.length === 0)
    throw new Error("A catalogue input needs a document path.");
  const next: IAutoMovieHumanPersonDocument = structuredClone(document);
  const chain: Record<string, unknown>[] = [
    next as unknown as Record<string, unknown>,
  ];
  for (const key of path.slice(0, -1)) {
    const parent: Record<string, unknown> = chain[chain.length - 1];
    const child: unknown = Object.hasOwn(parent, key) ? parent[key] : undefined;
    if (typeof child === "object" && child !== null)
      chain.push(child as Record<string, unknown>);
    else if (value === undefined) return next;
    else {
      // the record that holds the value starts from its owner's default, when one exists
      const created: Record<string, unknown> =
        seed !== null &&
        chain.length === seedPath.length &&
        seedPath.every(
          (member: string, index: number): boolean => path[index] === member,
        )
          ? (structuredClone(seed) as Record<string, unknown>)
          : {};
      Object.defineProperty(parent, key, {
        value: created,
        enumerable: true,
        configurable: true,
        writable: true,
      });
      chain.push(created);
    }
  }
  const leaf: string = path[path.length - 1];
  if (value !== undefined) {
    Object.defineProperty(chain[chain.length - 1], leaf, {
      value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
    return next;
  }
  delete chain[chain.length - 1][leaf];
  // prune the records this removal emptied, keeping each document's required members
  for (let depth: number = chain.length - 1; depth >= 1; --depth) {
    const key: string = path[depth - 1];
    const required: boolean =
      depth === 1
        ? key === "face" || key === "body"
        : depth === 2 && key === "shape";
    if (required || Object.keys(chain[depth]).length !== 0) break;
    delete chain[depth - 1][key];
  }
  return next;
}
