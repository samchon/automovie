import type { Point } from "./Point";

/**
 * An authored perspective pose and lens copied into the public camera navigator.
 *
 * @author Samchon
 */
export interface TourView {
  /** Stable authored camera address used by query links and selection. */
  id: string;

  /** Readable label derived from the authored id. */
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
