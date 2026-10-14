import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Apply one display selection to a reused product viewport before camera framing and drawing. Every show restores light directions, shadows and pass, then isolates and hides meshes; a prior capture's state cannot become the next default. Product viewport hooks own materials, lights and shadow-map invalidation. An unknown isolation or hidden mesh refuses before a frame is delivered. Numerical documents, build inputs and cache identities are untouched. A resident Node client may predate the shadow field while its browser code has updated; that missing field resets shadows to enabled. Unknown part names are admitted before changing light, shadow, pass or visibility state.
 *
 * @evidence contracts/common.md#principled-implementation Display requests validate selected/hidden identities against current observed parts before changing viewport state; light/shadow/pass resets prevent a reused resident's previous capture from becoming the next default.
 * @evidence contracts/common.md#clear-and-simple-design Product observation and light hooks own actual display changes; this adapter coordinates one complete address selection before framing and drawing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown mesh names refuse instead of producing a blank frame, and legacy missing shadow/light fields have explicit enabled/null meanings rather than subject-specific compensation.
 * @evidence contracts/common.md#meaningful-documentation The prose defines display-only effects, reset order, unknown-name refusal and missing-shadow enabled behavior; numerical documents and keys remain untouched.
 * @evidence contracts/performance.md#efficient-algorithms A Set of N observed names admits P selected and H hidden names in O(N + P + H); product hooks independently perform their own supported observation checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Applying selection mutates one resident's display; numerical document-key equality does not make pass, light or visibility effects reusable across addresses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This adapter borrows the viewport and allocates only transient name/admission collections; pass materials, lights and GPU retirement remain viewport-owned.
 */
export function applyHumanViewerVisibility(
  stage: {
    setLightDirection?: (input: HumanViewerAddress["light"]) => void;
    setShadows: (enabled: boolean) => void;
    observe: {
      pass: (pass: HumanViewerAddress["pass"]) => void;
      isolate: (parts: string[] | null) => string[];
      hide: (parts: string[] | null) => string[];
      parts: () => string[];
    };
  },
  address: Pick<HumanViewerAddress, "pass" | "parts" | "hide"> &
    Partial<Pick<HumanViewerAddress, "shadows" | "light">>,
): void {
  const names: Set<string> = new Set<string>(stage.observe.parts());
  const unknown: string[] = [...address.parts, ...address.hide].filter(
    (name: string): boolean => !names.has(name),
  );
  if (unknown.length !== 0)
    throw new Error("Unknown mesh: " + unknown.join(","));
  const light: HumanViewerAddress["light"] = address.light ?? null;
  if (stage.setLightDirection === undefined) {
    if (light !== null)
      throw new Error(
        "Light direction overrides require a Body or Person viewport",
      );
  } else stage.setLightDirection(light);
  stage.setShadows(address.shadows ?? true);
  stage.observe.pass(address.pass);
  const missing: string[] = stage.observe.isolate(
    address.parts.length === 0 ? null : address.parts,
  );
  if (missing.length !== 0)
    throw new Error("Unknown mesh: " + missing.join(","));
  const hidden: string[] = stage.observe.hide(
    address.hide.length === 0 ? null : address.hide,
  );
  if (hidden.length !== 0) throw new Error("Unknown mesh: " + hidden.join(","));
}
