import type { Point } from "./Point";

/**
 * An authored perspective pose and lens copied into the public camera navigator.
 *
 * @evidence contracts/common.md#principled-implementation The exporter normalizes three source camera representations to XYZ positions, a world look target and perspective lens fields; numeric admission remains with the first-party producer.
 * @evidence contracts/common.md#clear-and-simple-design One camera record serves URL selection, panel labels and applyTourView, keeping presentation separate from the opaque native geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera is inferred from a missing pose; specialized section observations remain outside this perspective record.
 * @evidence contracts/common.md#meaningful-documentation Members specify identity, display use, meters and vertical lens degrees for the browser consumer.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased camera record chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no work across camera selections.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no camera or renderer lifetime.
 *
 * @author Samchon
 */
export interface TourView {
  /** Stable authored camera address used by query links and selection. */
  id: string;

  /** Readable navigation label, derived from the id except for the starting modern-house view. */
  label: string;

  /** Source observation category displayed by the navigator. */
  group: string;

  /** World eye position in meters. */
  position: Point;

  /** World point the camera faces, in meters. */
  target: Point;

  /** Vertical perspective field of view in degrees. */
  fov: number;

  /** Near clip distance in meters. */
  near: number;

  /** Far clip distance in meters. */
  far: number;
}
