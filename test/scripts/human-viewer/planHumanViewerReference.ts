/**
 * Compute display-only local-reference composition. A missing photograph has
 * no layer, including when an address requested one. The public plan contains
 * only presentation values: no bytes, local filename or source path can enter
 * a capture manifest through this representation.
 *
 * @evidence contracts/common.md#principled-implementation Missing references produce no layer; each finite closed mode maps to its own layout semantics.
 * @evidence contracts/common.md#clear-and-simple-design Presentation is independent of local file resolution and numerical model compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference composition changes pixels only and never optimizes anatomical inputs.
 * @evidence contracts/common.md#meaningful-documentation Explains absent-reference behavior and the photograph-free plan boundary.
 */
export function planHumanViewerReference(available: boolean, mode: "split" | "overlay" | "swipe" | null, opacity: number):
  { enabled: boolean; mode: "split" | "overlay" | "swipe" | null; renderOpacity: number } {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new Error("Reference opacity must lie between zero and one");
  if (!available || mode === null) return { enabled: false, mode: null, renderOpacity: 1 };
  return { enabled: true, mode, renderOpacity: mode === "overlay" ? opacity : 1 };
}
