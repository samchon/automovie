/**
 * Compute display-only local-reference composition. A missing photograph has no layer, including when an address requested one. The public plan contains only presentation values: no bytes, local filename or source path can enter a capture manifest through this representation.
 *
 * @evidence contracts/common.md#principled-implementation Photo availability and requested mode determine display-only composition after finite bounded-opacity admission.
 * @evidence contracts/common.md#clear-and-simple-design Three presentation fields express enable/mode/render share without a second image owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable photos create no layer and no bytes or local paths enter the public plan.
 * @evidence contracts/common.md#meaningful-documentation Documentation limits output to presentation and describes missing-photograph behavior.
 * @evidence contracts/performance.md#efficient-algorithms Fixed availability/mode branches and opacity arithmetic are independent of image pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work Current supplied availability derives the plan without another photograph's composition cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar presentation output owns no image, canvas or viewport allocation.
 */
export function planHumanViewerReference(
  available: boolean,
  mode: "split" | "overlay" | "swipe" | null,
  opacity: number,
): {
  enabled: boolean;
  mode: "split" | "overlay" | "swipe" | null;
  renderOpacity: number;
} {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1)
    throw new Error("Reference opacity must lie between zero and one");
  if (!available || mode === null)
    return { enabled: false, mode: null, renderOpacity: 1 };
  return {
    enabled: true,
    mode,
    renderOpacity: mode === "overlay" ? opacity : 1,
  };
}
