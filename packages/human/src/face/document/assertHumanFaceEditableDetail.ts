import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";

/**
 * Keep free geometry populations in the immutable source recipe. An editable
 * nonempty array may otherwise replace skin relief points, nasal/lid sections,
 * dental rows or a lock's root-to-tip guide. Source arrays are inherited by
 * omission rather than copied into editable detail; an empty array removes
 * an inherited optional population. The legacy additional-hair editor may change
 * scalar shape/finish values but must keep every nonempty card population
 * equal to the selected source layer. Skin-colour regions and iris RGB
 * endpoints change reflectance only and are admitted independently. Scalar
 * and enum bounds remain the components'
 * responsibility; this boundary alone does not certify their science.
 *
 * @evidence contracts/common.md#principled-implementation Recursive path admission keeps nonempty geometric arrays in the immutable basis, with explicit reflectance-array exceptions and exact source-card comparison for additional hair layers. Empty arrays are inherited-population removal switches; current parser/resolver/editor consumers use the same boundary.
 * @evidence contracts/common.md#clear-and-simple-design One path walker owns editable population restrictions and one structural comparator owns unchanged card equality, leaving scalar/enum and geometry envelopes to components.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit skin-colour/iris paths change reflectance, and named hair layers may change scalars only while retaining source card guides. Other nonempty array replacement or cycles refuse; no copied mock geometry or coordinate fitting bypasses the immutable source.
 * @evidence contracts/common.md#meaningful-documentation Prose gives omission versus empty removal, reflectance exceptions, source-equal hair populations and limits of scalar/component validation; supplied documents are never mutated.
 * @evidence contracts/performance.md#efficient-algorithms Work follows expanded override paths and structural card comparisons; each hair-layer lookup scans source layers, so L edits can cost O(L squared) plus compared guide data. Repeated shared acyclic subtrees are revisited and recursion has no depth cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Active path sets separate cycles from shared acyclic references, and all parse/replay/edit consumers share this rule. Mutable document/source pairs receive fresh comparisons rather than cached equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Path/comparison sets are invocation-local and successful visits remove members; only errors or void transfer. No source clone, retained population registry or external resource is acquired.
 */
export function assertHumanFaceEditableDetail(
  document: Pick<IAutoMovieHumanFaceDocument, "basis" | "detail" | "asymmetry">,
): void {
  const same: (a: unknown, b: unknown, active?: WeakSet<object>) => boolean = (
    a: unknown,
    b: unknown,
    active: WeakSet<object> = new WeakSet<object>(),
  ): boolean => {
    if (Object.is(a, b)) return true;
    if (
      a === null ||
      b === null ||
      typeof a !== "object" ||
      typeof b !== "object"
    )
      return false;
    if (Array.isArray(a) !== Array.isArray(b) || active.has(a)) return false;
    active.add(a);
    const left: [string, unknown][] = Object.entries(a);
    const right: [string, unknown][] = Object.entries(b);
    const equal: boolean =
      left.length === right.length &&
      left.every(
        ([key, value]: [string, unknown]): boolean =>
          Object.hasOwn(b, key) &&
          same(value, (b as Record<string, unknown>)[key], active),
      );
    active.delete(a);
    return equal;
  };
  const active: WeakSet<object> = new WeakSet<object>();
  const visit: (value: unknown, source: unknown, path: string) => void = (
    value: unknown,
    source: unknown,
    path: string,
  ): void => {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      if (path === "detail.skinColour") return;
      if (
        [
          "detail.eye.irisPigment.base",
          "detail.eye.irisPigment.variation",
          "asymmetry.left.eye.irisPigment.base",
          "asymmetry.left.eye.irisPigment.variation",
          "asymmetry.right.eye.irisPigment.base",
          "asymmetry.right.eye.irisPigment.variation",
        ].includes(path)
      )
        return;
      if (
        path.startsWith("detail.hairLayers[") &&
        path.endsWith(".profile.cards") &&
        same(value, source)
      )
        return;
      if (path === "detail.hairLayers") {
        const sourceLayers: readonly { id?: string }[] = Array.isArray(source)
          ? source
          : [];
        for (const [index, layer] of value.entries()) {
          if (
            layer === null ||
            typeof layer !== "object" ||
            Array.isArray(layer)
          )
            throw new Error(
              "Editable facial hair layers need an object profile.",
            );
          const current: { id?: string } = layer as { id?: string };
          const original: { id?: string } | undefined = sourceLayers.find(
            (one: { id?: string }): boolean => one.id === current.id,
          );
          visit(layer, original, path + "[" + index + "]");
        }
        return;
      }
      throw new Error(
        "Editable facial detail cannot replace a source geometry array: " +
          path,
      );
    }
    if (active.has(value))
      throw new Error("Editable facial detail cannot contain a cycle: " + path);
    active.add(value);
    for (const [name, child] of Object.entries(value))
      visit(
        child,
        source !== null && typeof source === "object"
          ? (source as Record<string, unknown>)[name]
          : undefined,
        path + "." + name,
      );
    active.delete(value);
  };
  visit(document.detail, document.basis.recipe, "detail");
  for (const side of ["right", "left"] as const)
    visit(
      document.asymmetry?.[side],
      document.basis.recipe,
      "asymmetry." + side,
    );
}
