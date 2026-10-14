import type { IHumanViewerReferenceContext } from "./IHumanViewerReferenceContext.js";
import { composeHumanViewerReference } from "./composeHumanViewerReference.js";

/**
 * Compose the rendered canvas with its reference photograph into one PNG data URL, the same picture the page shows. The page keeps the photograph as a DOM layer, so the canvas alone lacks it. The caller creates the output surface; the photograph is borrowed for composition and never persisted here.
 *
 * @evidence contracts/common.md#principled-implementation The shared reference compositor combines the actual render and decoded photograph using the same layout as display saving, then the output surface encodes PNG bytes.
 * @evidence contracts/common.md#clear-and-simple-design This synchronous capture adapter adds only PNG data-URL encoding to composeHumanViewerReference, keeping layer and landmark drawing in their shared owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller-supplied images and observed landmarks are composed directly without a subject-specific expected picture or photograph persistence path.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why canvas-only readback misses the DOM photograph and identifies borrowed input versus caller-created output ownership.
 * @evidence contracts/performance.md#efficient-algorithms Layout and landmark processing follow marker count, while canvas drawing and PNG encoding follow output pixel area; one output surface avoids an additional image-byte intermediate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work On-screen source pixels and photograph state are mutable, so surface identity alone does not authorize sharing a previous composition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's factory supplies one temporary composition surface; the adapter returns its encoded string and retains no photograph, canvas or file handle.
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
  const out: ReturnType<typeof props.create> =
    composeHumanViewerReference(props);
  return out.toDataURL("image/png");
}
