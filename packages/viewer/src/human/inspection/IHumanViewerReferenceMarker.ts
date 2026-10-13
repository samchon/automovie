/**
 * One observed landmark placed in capture pixels.  *
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
