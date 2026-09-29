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
 */
export function assertHumanFaceEditableDetail(
  document: Pick<IAutoMovieHumanFaceDocument, "basis" | "detail" | "asymmetry">,
): void {
  const same = (
    a: unknown,
    b: unknown,
    active = new WeakSet<object>(),
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
    const left = Object.entries(a);
    const right = Object.entries(b);
    const equal =
      left.length === right.length &&
      left.every(
        ([key, value]) =>
          Object.hasOwn(b, key) &&
          same(value, (b as Record<string, unknown>)[key], active),
      );
    active.delete(a);
    return equal;
  };
  const active = new WeakSet<object>();
  const visit = (value: unknown, source: unknown, path: string): void => {
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
        const sourceLayers = Array.isArray(source) ? source : [];
        for (const [index, layer] of value.entries()) {
          if (
            layer === null ||
            typeof layer !== "object" ||
            Array.isArray(layer)
          )
            throw new Error(
              "Editable facial hair layers need an object profile.",
            );
          const current = layer as { id?: string };
          const original = sourceLayers.find(
            (one: { id?: string }) => one.id === current.id,
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
