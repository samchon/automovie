import {
  physicalPlanarPolygon as Polygon,
  physicalOneStepCaptureRegion as Region,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The one-step capture region is IHMC 201903's
 * (`OneStepCaptureRegionCalculator` l.102-235): the reachable fan of a support
 * foot toward the swing side, and the points where a step lands with the
 * capture point, diverging about the foot's extreme centres of pressure for the
 * swing time left, inside it (Koolen et al. 2012, Part 2).
 *
 * Scenarios, a left support foot 0.2 x 0.1 m about its sole's origin, a 0.1 m
 * foot width, a 0.6 m range and omega 3.2 per second:
 *
 * 1. The reachable fan lies right of the foot, y <= -0.05, within the range.
 * 2. With the capture point inside the foot the region is the reachable fan.
 * 3. With no time left and the capture point at (0, -0.15), the capture point
 *    itself is on the region and the foot's centre is not.
 * 4. With 0.2 s left and the capture point at (0.05, -0.12), below the foot, the
 *    predicted capture point from each corner it sees, cop + (xi - cop)
 *    e^(omega t), lies on the region.
 * 5. With 0.5 s left and the capture point at (0, -0.5) every prediction is out of
 *    reach: the region is empty and its area zero.
 *
 */
export function test_unit_engine_physics_physical_one_step_capture_region(): void {
  const foot: Polygon.IPoint[] = Polygon.hull([
    { x: -0.1, y: -0.05 },
    { x: 0.1, y: -0.05 },
    { x: 0.1, y: 0.05 },
    { x: -0.1, y: 0.05 },
  ]);
  const omega: number = 3.2;
  const region = (
    capture: Polygon.IPoint,
    remaining: number,
  ): Polygon.IPoint[] =>
    Region({
      support: "left",
      remaining,
      capture,
      omega,
      foot,
      footWidth: 0.1,
      range: 0.6,
    });
  const on = (polygon: readonly Polygon.IPoint[], p: Polygon.IPoint): boolean =>
    Polygon.signedDistance(polygon, p) <= 1e-9;

  // 1. The fan opens right of a left foot, within the range.
  const fan: Polygon.IPoint[] = Region.reachable("left", 0.1, 0.6);
  TestValidator.predicate(
    "fan side and range",
    fan.every(
      (p: Polygon.IPoint): boolean =>
        p.y <= -0.05 + 1e-12 &&
        Math.hypot(p.x, p.y) <= Math.hypot(0.6, 0.05) + 1e-12,
    ),
  );

  // 2. Inside the foot: the fan.
  TestValidator.equals("inside", region({ x: 0.02, y: 0.01 }, 0.4), fan);

  // 3. No time left: the capture point is on the region, the foot is not.
  const now: Polygon.IPoint[] = region({ x: 0, y: -0.15 }, 0);
  TestValidator.predicate("capture on region", on(now, { x: 0, y: -0.15 }));
  TestValidator.predicate("foot off region", !on(now, { x: 0, y: 0 }));

  // 4. The predictions within reach are on the region: from below the foot
  // the capture point sees its back edge's two corners.
  const capture: Polygon.IPoint = { x: 0.05, y: -0.12 };
  const later: Polygon.IPoint[] = region(capture, 0.2);
  const growth: number = Math.exp(omega * 0.2);
  const predictions: Polygon.IPoint[] = [
    { x: -0.1, y: -0.05 },
    { x: 0.1, y: -0.05 },
  ]
    .map(
      (cop: Polygon.IPoint): Polygon.IPoint => ({
        x: cop.x + (capture.x - cop.x) * growth,
        y: cop.y + (capture.y - cop.y) * growth,
      }),
    )
    .filter(
      (p: Polygon.IPoint): boolean =>
        p.y < -0.05 && Math.hypot(p.x, p.y) < 0.59,
    );
  TestValidator.equals("predictions in reach", predictions.length, 2);
  TestValidator.predicate(
    "predictions on region",
    predictions.every((p: Polygon.IPoint): boolean => on(later, p)),
  );

  // 5. Out of reach: empty.
  const far: Polygon.IPoint[] = region({ x: 0, y: -0.5 }, 0.5);
  TestValidator.equals("empty", far, []);
  TestValidator.equals("area", Polygon.area(far), 0);
}
