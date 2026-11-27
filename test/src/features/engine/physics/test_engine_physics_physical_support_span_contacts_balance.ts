import {
  AutoMovieEnginePhysicalIcpController,
  AutoMovieEnginePhysicalPlanarPolygon,
  AutoMovieEnginePhysicalSupportSpanContacts,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * One balance for every body: IHMC's capture-point controller
 * (`AutoMovieEnginePhysicalIcpController`) on the hull of the planted contacts
 * (`AutoMovieEnginePhysicalSupportSpanContacts.hull`), whatever their number.
 *
 * Scenarios, N = 3, 4, 6 and 8 point contacts on a 0.15 m circle about (0.4,
 * -0.2), the plan at rest at that centre, omega = sqrt(9.81 / 0.9), Zulu's
 * parameters:
 *
 * 1. Quiet stance, the capture point and the centre of mass on the plan: the
 *    feedback pair stays zero and the centre of pressure is the authored
 *    capture point.
 * 2. A 2 cm error: the centre of pressure lies inside the hull and on the error's
 *    side of the plan, K e pushing the capture point back, so its rate omega
 *    (xi - cmp) points against the error.
 * 3. A 0.5 m error, past the hull: the centre of pressure saturates on the hull
 *    shrunk by the 2 mm safe distance (`ICPControllerQPSolver` l.643-669).
 */
export function test_engine_physics_physical_support_span_contacts_balance(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
  const centre: { x: number; z: number } = { x: 0.4, z: -0.2 };
  const frame = AutoMovieEnginePhysicalSupportSpanContacts.WORLD;
  const desired = AutoMovieEnginePhysicalPlanarPolygon.local(frame, centre);
  const run = (
    support: AutoMovieEnginePhysicalPlanarPolygon.IPoint[],
    error: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
  ): AutoMovieEnginePhysicalIcpController.IResult =>
    AutoMovieEnginePhysicalIcpController.update({
      state: AutoMovieEnginePhysicalIcpController.create(),
      support,
      desired,
      desiredVelocity: { x: 0, y: 0 },
      capture: { x: desired.x + error.x, y: desired.y + error.y },
      center: desired,
      omega,
      dt: 0.004,
    });

  for (const n of [3, 4, 6, 8]) {
    const hull: AutoMovieEnginePhysicalPlanarPolygon.IPoint[] =
      AutoMovieEnginePhysicalSupportSpanContacts.hull(
        Array.from(
          { length: n },
          (_, i: number): AutoMovieEnginePhysicalSupportSpanContacts.IContact => ({
            bone: `limb${i}`,
            points: [
              {
                x: centre.x + 0.15 * Math.cos((2 * Math.PI * i) / n + 0.3),
                z: centre.z + 0.15 * Math.sin((2 * Math.PI * i) / n + 0.3),
              },
            ],
          }),
        ),
      );
    TestValidator.equals(`${n}: hull`, hull.length, n);

    // 1. Quiet stance.
    const quiet: AutoMovieEnginePhysicalIcpController.IResult = run(hull, { x: 0, y: 0 });
    TestValidator.predicate(
      `${n}: quiet stance`,
      quiet.state.copDelta.x === 0 &&
        quiet.state.copDelta.y === 0 &&
        Math.abs(quiet.cop.x - desired.x) < PhysicalTolerance.ROUNDING &&
        Math.abs(quiet.cop.y - desired.y) < PhysicalTolerance.ROUNDING,
    );

    // 2. A small error: inside, on its side, the capture point driven back.
    const error: AutoMovieEnginePhysicalPlanarPolygon.IPoint = { x: 0.016, y: -0.012 };
    const small: AutoMovieEnginePhysicalIcpController.IResult = run(hull, error);
    const shift = {
      x: small.cop.x - desired.x,
      y: small.cop.y - desired.y,
    };
    const rate = {
      x: omega * (desired.x + error.x - small.cmp.x),
      y: omega * (desired.y + error.y - small.cmp.y),
    };
    TestValidator.predicate(
      `${n}: small error`,
      AutoMovieEnginePhysicalPlanarPolygon.inside(hull, small.cop) &&
        shift.x * error.x + shift.y * error.y > 0 &&
        rate.x * error.x + rate.y * error.y < 0,
    );

    // 3. Past the hull: saturated on the shrunk edge.
    const far: AutoMovieEnginePhysicalIcpController.IResult = run(hull, { x: 0.4, y: 0.3 });
    TestValidator.predicate(
      `${n}: saturated`,
      Math.abs(
        AutoMovieEnginePhysicalPlanarPolygon.signedDistance(hull, far.cop) +
          AutoMovieEnginePhysicalIcpController.ZULU.safeCopDistance,
      ) < PhysicalTolerance.CONVERGED,
    );
  }
}
