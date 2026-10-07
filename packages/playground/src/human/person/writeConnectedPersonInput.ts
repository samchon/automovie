import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * Return a copy of a person document with one catalogue input written or
 * removed; the caller's document is not changed.
 *
 * Writing creates the records on the way to the value. When the record that
 * holds the value is absent and its owner publishes a default for it, that
 * record starts as a copy of the owner's default, so one member can be
 * edited without the caller supplying the rest. `seedPath` names that record
 * when the owner default belongs to an ancestor,
 * such as a whole brow population containing its named grain quantities.
 * Removing deletes the
 * value and then every record it emptied, up to but not including the face
 * and body documents and their required `shape` records, so removing the
 * last head trait restores an absent `headShape`, as the document means by
 * omission. Whether the resulting document is complete and in range is the
 * owner's admission to decide, not this function's.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Writes or removes one listed input in a copy of the working person document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Leaves the caller's document untouched so a refused edit keeps the last valid one.
 * @author Samchon
 */
export function writeConnectedPersonInput(
  document: IAutoMovieHumanPersonDocument,
  path: readonly string[],
  value: number | string | null | undefined,
  seed: object | null = null,
  seedPath: readonly string[] = path.slice(0, -1),
): IAutoMovieHumanPersonDocument {
  if (path.length === 0) throw new Error("A catalogue input needs a document path.");
  const next = structuredClone(document);
  const chain: Record<string, unknown>[] = [next as unknown as Record<string, unknown>];
  for (const key of path.slice(0, -1)) {
    const parent = chain[chain.length - 1];
    const child = parent[key];
    if (typeof child === "object" && child !== null) chain.push(child as Record<string, unknown>);
    else if (value === undefined) return next;
    else {
      // the record that holds the value starts from its owner's default, when one exists
      const created: Record<string, unknown> =
        seed !== null && chain.length === seedPath.length && seedPath.every((member, index) => path[index] === member)
          ? structuredClone(seed) as Record<string, unknown> : {};
      parent[key] = created;
      chain.push(created);
    }
  }
  const leaf = path[path.length - 1];
  if (value !== undefined) {
    chain[chain.length - 1][leaf] = value;
    return next;
  }
  delete chain[chain.length - 1][leaf];
  // prune the records this removal emptied, keeping each document's required members
  for (let depth = chain.length - 1; depth >= 1; --depth) {
    const key = path[depth - 1];
    const required = depth === 1 ? key === "face" || key === "body" : depth === 2 && key === "shape";
    if (required || Object.keys(chain[depth]).length !== 0) break;
    delete chain[depth - 1][key];
  }
  return next;
}
