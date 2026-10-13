/**
 * One observed landmark placed in capture pixels.  *
 *
 * @evidence contracts/common.md#principled-implementation Pixel marker coordinates are the image-to-capture layout's projection of an observed photograph landmark.
 * @evidence contracts/common.md#clear-and-simple-design Only marker centre and group label are needed by PNG and SVG overlays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Markers preserve observations without determining the subject's anatomical construction.
 * @evidence contracts/common.md#meaningful-documentation x and y use capture pixels from the top-left origin, and group retains the reference observation identity.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceMarker {
  /** Horizontal position of the observed marker centre in capture pixels. */
  x: number;

  /** Vertical position of the observed marker centre in capture pixels. */
  y: number;

  /** Original observed landmark group, shared by the PNG and SVG overlays. */
  group: string;
}
