import { drawHumanViewerReference } from "./drawHumanViewerReference.js";
import { type IHumanViewerReferenceContext } from "./IHumanViewerReferenceContext.js";
import { layoutHumanViewerReference } from "./layoutHumanViewerReference.js";

/**
 * Paint the completed display and its visible reference layers onto an owned
 * surface. Both synchronous capture and asynchronous display saving consume
 * this composition, so split, overlay, swipe and landmarks share one owner.
 */
export function composeHumanViewerReference<Surface extends {
  width: number;
  height: number;
  getContext: (kind: "2d") => IHumanViewerReferenceContext | null;
}>(props: {
  composition: { mode: "split" | "overlay" | "swipe"; opacity: number; size: number };
  photo: { naturalWidth: number; naturalHeight: number };
  landmarks: { x: number; y: number; group: string }[];
  render: unknown;
  create: () => Surface;
}): Surface {
  const { composition, photo } = props;
  const layout = layoutHumanViewerReference(
    composition.mode, composition.size, composition.opacity,
    { width: photo.naturalWidth, height: photo.naturalHeight }, props.landmarks,
  );
  const out = props.create();
  out.width = layout.width;
  out.height = layout.height;
  const context = out.getContext("2d");
  if (context === null) throw new Error("A 2D surface is required to compose the reference");
  drawHumanViewerReference(context, layout.layers, { render: props.render, photo }, layout.markers, layout.markerRadius);
  return out;
}
