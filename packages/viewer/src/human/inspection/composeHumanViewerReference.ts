import { drawHumanViewerReference } from "./drawHumanViewerReference.js";
import { type IHumanViewerReferenceContext } from "./IHumanViewerReferenceContext.js";
import { layoutHumanViewerReference } from "./layoutHumanViewerReference.js";

/**
 * Paint the completed display and its visible reference layers onto an owned
 * surface. Both synchronous capture and asynchronous display saving consume
 * this composition, so split, overlay, swipe and landmarks share one owner.
 *
 * @evidence contracts/common.md#principled-implementation The existing layout and painter reproduce the DOM reference composition without changing its photograph or camera.
 * @evidence contracts/common.md#clear-and-simple-design One compositor supplies a surface independently of PNG encoding.
 * @evidence contracts/common.md#meaningful-documentation States surface ownership and the two encoding consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Creates an owned 2D surface and consumes the shared reference layout/painter with the caller's real canvas and photo, without altering their pixels or substituting a subject-specific composition.
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
