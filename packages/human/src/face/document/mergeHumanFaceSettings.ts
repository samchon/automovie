import type { AutoMovieHumanFaceOverride } from "../AutoMovieHumanFaceOverride";

/**
 * Merge typed face settings without retaining caller-owned objects. An omitted
 * value retains its basis, object fields recurse, and arrays replace in full.
 * This is composition, not raw-document validation; part admission still checks
 * the resolved dimensions and relationships before geometry can be published.
 * Repeated subtree clones can copy the same inherited descendants at several
 * nesting levels. Typed plain acyclic settings are the input contract; this
 * merger is not a hostile-object or cyclic-patch traversal boundary.
 *
 * @evidence contracts/common.md#principled-implementation Undefined inherits a cloned basis; scalar/null/array patches replace by clone and ordinary object patches recurse by field. Typed plain acyclic settings from resolver/editor consumers establish the structural contract; an object cannot replace an existing scalar/array.
 * @evidence contracts/common.md#clear-and-simple-design One recursive unknown-valued implementation serves the generic typed return, keeping composition distinct from document/profile admission rather than duplicating those checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prototype-mutating keys refuse and arrays replace completely instead of an invented element merge. This is not validation of arbitrary class/cyclic patches; scalar/geometry domains remain later owner responsibilities.
 * @evidence contracts/common.md#meaningful-documentation Prose gives omission, null/scalar/array replacement, deep ownership, typed plain acyclic premise and repeated subtree-copy cost.
 * @evidence contracts/performance.md#efficient-algorithms Each patched object clones its inherited subtree before recursion, so nested overrides can recopy descendants with worst work proportional to subtree sizes summed across patched ancestors, not merely final output size. No unrelated geometry computation occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged fields inherit copied values and callers reuse this composition rule; every returned setting must be independently owned, so mutable basis/patch outputs are not shared in a persistent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The completed cloned settings transfer to the caller; superseded subtree clones and recursion intermediates become collectible. No explicit depth/byte cap or external handle is owned here.
 */
export function mergeHumanFaceSettings<T>(
  basis: T,
  override?: NoInfer<AutoMovieHumanFaceOverride<T>>,
): T {
  const merge: (base: unknown, patch: unknown) => unknown = (base: unknown, patch: unknown): unknown => {
    if (patch === undefined) return structuredClone(base);
    if (patch === null || typeof patch !== "object" || Array.isArray(patch))
      return structuredClone(patch);
    if (
      base !== undefined &&
      (base === null || typeof base !== "object" || Array.isArray(base))
    )
      throw new Error(
        "An object override cannot replace a scalar or array face setting.",
      );
    const result: Record<string, unknown> = structuredClone(
      base ?? {},
    ) as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch)) {
      if (key === "__proto__" || key === "prototype" || key === "constructor")
        throw new Error("Face settings cannot contain prototype keys.");
      result[key] = merge(result[key], value);
    }
    return result;
  };
  return merge(basis, override) as T;
}
