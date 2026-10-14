import { type IHumanViewerReferenceContext } from "./IHumanViewerReferenceContext.js";
import { drawHumanViewerReference } from "./drawHumanViewerReference.js";
import { layoutHumanViewerReference } from "./layoutHumanViewerReference.js";

/**
 * Paint the completed display and its visible reference layers onto an owned surface. Both synchronous capture and asynchronous display saving consume this composition, so split, overlay, swipe and landmarks share one owner.
 *
 * @evidence contracts/common.md#principled-implementation Shared layout computes fitted photograph/layer/landmark pixels, then canvas composition reproduces the visible reference mode on the caller-created output surface.
 * @evidence contracts/common.md#clear-and-simple-design Geometry belongs to layoutHumanViewerReference and borrowed drawing-state isolation to drawHumanViewerReference; this function coordinates output sizing and context admission only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Display saving and synchronous capture use identical composition coordinates instead of maintaining separately tuned screenshot layouts.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies owned output versus borrowed completed display/reference layers and both production consumers of the shared composition.
 * @evidence contracts/performance.md#efficient-algorithms Marker layout costs O(M), while layer rasterization follows output area; one surface is created and reused by the delegated drawing without an additional encoded-image intermediate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed canvas/photo contents and requested composition can change, so this owner does not cache output by surface identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The factory-created surface transfers to the caller on success; missing 2D context refuses, and temporary references retain no input photograph or filesystem handle after return.
 */
export function composeHumanViewerReference<
  Surface extends {
    width: number;
    height: number;
    getContext: (kind: "2d") => IHumanViewerReferenceContext | null;
  },
>(props: {
  composition: {
    mode: "split" | "overlay" | "swipe";
    opacity: number;
    size: number;
  };
  photo: { naturalWidth: number; naturalHeight: number };
  landmarks: { x: number; y: number; group: string }[];
  render: unknown;
  create: () => Surface;
}): Surface {
  const { composition, photo }: Pick<typeof props, "composition" | "photo"> =
    props;
  const layout: ReturnType<typeof layoutHumanViewerReference> =
    layoutHumanViewerReference(
      composition.mode,
      composition.size,
      composition.opacity,
      { width: photo.naturalWidth, height: photo.naturalHeight },
      props.landmarks,
    );
  const out: Surface = props.create();
  out.width = layout.width;
  out.height = layout.height;
  const context: IHumanViewerReferenceContext | null = out.getContext("2d");
  if (context === null)
    throw new Error("A 2D surface is required to compose the reference");
  drawHumanViewerReference(
    context,
    layout.layers,
    { render: props.render, photo },
    layout.markers,
    layout.markerRadius,
  );
  return out;
}
