// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/captureRegion/FootstepAdjustor.java,
// adjustFootstep l.68-110, projectFootstepInCaptureRegion l.120-147 and
// calculateTouchdownFootPolygon l.156-166. See NOTICE.
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

/**
 * A planned footstep moved into a capture region when its touchdown outline
 * misses it (IHMC 201903 `FootstepAdjustor`): the outline is shrunk to half
 * about the footstep's position, and only when it does not meet the region is
 * the footstep moved, to the region's boundary point nearest a point ten metres
 * beyond the region's centroid away from the support foot's centroid, so the
 * step lands as far out in the region as it can.
 *
 * Every point is in one horizontal frame (`physicalPlanarPolygon`).
 *
 * @param input The footstep's position, the swing foot's contact outline placed
 *   at it, the support foot's centroid and the capture region, clockwise.
 * @returns The footstep's position, moved or not, and whether it moved; an
 *   empty region moves nothing.
 */
export function physicalFootstepAdjustor(input: {
  position: Polygon.IPoint;
  outline: readonly Polygon.IPoint[];
  support: Polygon.IPoint;
  region: readonly Polygon.IPoint[];
}): physicalFootstepAdjustor.IResult {
  if (input.region.length === 0)
    return { position: { ...input.position }, adjusted: false };

  // The touchdown outline shrunk to half about the footstep (l.156-166) meets
  // the region: the footstep stays (l.89-100).
  const touchdown: Polygon.IPoint[] = Polygon.hull(
    Polygon.scale(
      input.outline,
      input.position,
      physicalFootstepAdjustor.SHRINK_TOUCHDOWN_POLYGON_FACTOR,
    ),
  );
  if (Polygon.intersect(input.region, touchdown).length > 0)
    return { position: { ...input.position }, adjusted: false };

  // Otherwise to the region's boundary beyond its centroid, away from the
  // support (l.120-147).
  const centroid: Polygon.IPoint = Polygon.centroid(input.region);
  const dx: number = centroid.x - input.support.x;
  const dy: number = centroid.y - input.support.y;
  const length: number = Math.hypot(dx, dy);
  const far: Polygon.IPoint = {
    x:
      centroid.x + (dx / length) * physicalFootstepAdjustor.PROJECTION_DISTANCE,
    y:
      centroid.y + (dy / length) * physicalFootstepAdjustor.PROJECTION_DISTANCE,
  };
  return { position: Polygon.project(input.region, far), adjusted: true };
}

/** The adjustor's result and constants. */
export namespace physicalFootstepAdjustor {
  /** The footstep after the adjustment. */
  export interface IResult {
    /** Its position. */
    position: Polygon.IPoint;

    /** Whether it moved. */
    adjusted: boolean;
  }

  /** The touchdown outline's scale about the footstep (l.33). */
  export const SHRINK_TOUCHDOWN_POLYGON_FACTOR: number = 0.5;

  /**
   * How far beyond the region's centroid the projected point lies, metres
   * (l.137).
   */
  export const PROJECTION_DISTANCE: number = 10.0;
}
