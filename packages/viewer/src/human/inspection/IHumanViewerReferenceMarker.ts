/**
 * One observed landmark placed in capture pixels.
 *
 * @evidence contracts/common.md#principled-implementation The marker stores capture-pixel coordinates after layout transforms normalized observed landmarks into the photograph's fitted box.
 * @evidence contracts/common.md#clear-and-simple-design Position and original observation group are sufficient for both PNG circles and SVG overlay markers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Marker coordinates are observations mapped by shared layout; the type carries no manufactured anatomical target or subject exception.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish capture pixels from original observation groups and identify the PNG/SVG sharing boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A marker is an output coordinate record; landmark transformation and drawing costs are borne by layout and consumers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The marker introduces no retained lookup or invalidation key; each composition receives newly placed landmarks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numeric coordinates and a group label require no explicit disposal; the capture result owns the containing marker array.
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
