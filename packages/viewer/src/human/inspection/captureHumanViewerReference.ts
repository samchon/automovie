import type { IHumanViewerReferenceContext } from "./IHumanViewerReferenceContext.js";
import { composeHumanViewerReference } from "./composeHumanViewerReference.js";

/**
 * Compose the rendered canvas with its reference photograph into one PNG data
 * URL, the same picture the page shows. The page keeps the photograph as a DOM
 * layer, so the canvas alone lacks it. `create` supplies the scratch surface so
 * a test can stand in for a canvas; the photograph is read and never stored.
 *
 * @evidence contracts/common.md#principled-implementation Delegates geometry to the layout and drawing to the painter, so the capture equals the display composition.
 * @evidence contracts/common.md#clear-and-simple-design One function joins layout, surface and encoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document or photograph is special-cased and no bytes persist.
 * @evidence contracts/common.md#meaningful-documentation States why composition is needed and who owns the surface.
 */
export function captureHumanViewerReference(props: {
  composition: {
    mode: "split" | "overlay" | "swipe";
    opacity: number;
    size: number;
  };
  photo: { naturalWidth: number; naturalHeight: number };
  /** Landmarks to draw, unit image coordinates; empty draws none. */
  landmarks: { x: number; y: number; group: string }[];
  render: unknown;
  create: () => {
    width: number;
    height: number;
    getContext: (kind: "2d") => IHumanViewerReferenceContext | null;
    toDataURL: (type: string) => string;
  };
}): string {
  const out = composeHumanViewerReference(props);
  return out.toDataURL("image/png");
}
