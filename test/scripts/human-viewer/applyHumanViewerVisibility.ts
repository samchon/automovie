import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * Apply one display selection to a reused product viewport before camera
 * framing and drawing. Every show restores light directions, shadows and pass, then isolates
 * and hides meshes; a prior capture's state cannot become the next default.
 * Product viewport hooks own materials, lights and shadow-map invalidation.
 * An unknown isolation or hidden mesh refuses before a frame is delivered.
 * Numerical documents, build inputs and cache identities are untouched.
 * A resident Node client may predate the shadow field while its browser code
 * has updated; that missing field preserves the existing enabled-light state.
 *
 * @evidence contracts/common.md#principled-implementation Restores explicit display state in the order consumed by camera framing and uses product hooks for every scene mutation.
 * @evidence contracts/common.md#clear-and-simple-design Owns visibility admission independently of DOM, numerical building and camera placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Calls the viewport's supported setters without changing renderer internals or special-casing documents.
 * @evidence contracts/common.md#meaningful-documentation Explains reused-state restoration, ordering, ownership and refusal before frame delivery.
 */
export function applyHumanViewerVisibility(
  stage: {
    setLightDirection?: (input: HumanViewerAddress["light"]) => void;
    setShadows: (enabled: boolean) => void;
    observe: {
      pass: (pass: HumanViewerAddress["pass"]) => void;
      isolate: (parts: string[] | null) => string[];
      hide: (parts: string[] | null) => string[];
    };
  },
  address: Pick<HumanViewerAddress, "pass" | "parts" | "hide"> &
    Partial<Pick<HumanViewerAddress, "shadows" | "light">>,
): void {
  const light = address.light ?? null;
  if (stage.setLightDirection === undefined) {
    if (light !== null)
      throw new Error(
        "Light direction overrides require a Body or Person viewport",
      );
  } else stage.setLightDirection(light);
  stage.setShadows(address.shadows ?? true);
  stage.observe.pass(address.pass);
  const missing = stage.observe.isolate(
    address.parts.length === 0 ? null : address.parts,
  );
  if (missing.length !== 0)
    throw new Error("Unknown mesh: " + missing.join(","));
  const hidden = stage.observe.hide(
    address.hide.length === 0 ? null : address.hide,
  );
  if (hidden.length !== 0) throw new Error("Unknown mesh: " + hidden.join(","));
}
