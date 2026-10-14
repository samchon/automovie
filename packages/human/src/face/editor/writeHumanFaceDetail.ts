import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";

/**
 * Write or delete one numeric detail at a path of a document, in place on the
 * copy the caller passes.
 *
 * Containers along the path are detached first: `structuredClone` preserves
 * aliases, so a selected side or layer must not also edit its basis or a
 * sibling. Writing creates missing containers. Clearing (`undefined`) deletes
 * the key and every ancestor it leaves empty, and returns the document
 * unchanged when the path does not exist. Shared by `setHumanFaceDetail` and
 * `setHumanFaceHairLayerDetail`.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Current scalar writers supply a nonempty catalogue-derived path and an owned document copy. Shallow copies detach each existing path container because structuredClone preserves internal aliases; deletion prunes only newly empty ancestors and never creates a missing clear path.
 * @evidence contracts/common.md#clear-and-simple-design One mutation primitive shares path creation/alias detachment/pruning across scalar and named hair-layer transactions; catalogue and scalar/schema admission stay with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This intentionally mutates only the caller-owned copy; arbitrary empty/prototype/hostile paths are outside the catalogue-derived contract. Clearing preserves inheritance rather than writing guessed defaults or changing sibling/basis aliases.
 * @evidence contracts/common.md#meaningful-documentation Prose gives in-place copy ownership, alias preservation hazard, missing clear paths, ancestor pruning and current callers; no final geometry admission is performed.
 * @evidence contracts/performance.md#efficient-algorithms D path steps copy container fields/elements along the path; clearing scans ancestor keys until a nonempty container. Work follows summed copied container sizes, not just D scalar operations.
 * @evidence contracts/performance.md#reuse-equivalent-work Both scalar transactions share the exact path rule; unchanged siblings remain referenced within the already-owned copy while each edited container detaches aliases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The same document transfers after mutation and an O(D) ancestor table is local; removed containers become collectible absent sibling aliases, and no external resource/history is retained.
 */
export function writeHumanFaceDetail(
  next: IAutoMovieHumanFaceDocument,
  path: readonly string[],
  value: number | undefined,
): IAutoMovieHumanFaceDocument {
  let object: Record<string, unknown> = next as unknown as Record<string, unknown>;
  const ancestors: { object: Record<string, unknown>; key: string }[] = [];
  for (const key of path.slice(0, -1)) {
    if (object[key] === undefined) {
      if (value === undefined) return next;
      object[key] = {};
    } else {
      // structuredClone preserves aliases. Detach only the containers on this
      // path so a selected side/layer cannot also edit its basis or sibling.
      const child: unknown[] | Record<string, unknown> = object[key] as Record<string, unknown> | unknown[];
      object[key] = Array.isArray(child) ? [...child] : { ...child };
    }
    ancestors.push({ object, key });
    object = object[key] as Record<string, unknown>;
  }
  const key: string = path[path.length - 1];
  if (value === undefined) {
    if (!Object.hasOwn(object, key)) return next;
    delete object[key];
    for (const parent of ancestors.reverse()) {
      if (Object.keys(object).length !== 0) break;
      delete parent.object[parent.key];
      object = parent.object;
    }
  } else object[key] = value;
  return next;
}
